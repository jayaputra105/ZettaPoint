import { Router } from "express";
import { db, users, tasks, taskCompletions, spinRecords, transactions } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ADS_SPINS = 5;


const PRIZES = [
  { label: "50 Koin", coins: 50, usdt: 0, weight: 14.2 },
  { label: "150 Koin", coins: 150, usdt: 0, weight: 20.0 },
  { label: "300 Koin", coins: 300, usdt: 0, weight: 25.0 },
  { label: "500 Koin", coins: 500, usdt: 0, weight: 18.0 },
  { label: "1000 Koin", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "5 USDT", coins: 0, usdt: 5, weight: 0.2 },
  { label: "25 USDT", coins: 0, usdt: 25, weight: 0.0 }, // Jimat Pajangan Kasino 0%
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "1000 Koin", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "500 Koin", coins: 500, usdt: 0, weight: 5.6 },
  { label: "300 Koin", coins: 300, usdt: 0, weight: 5.0 },
];

function weightedRandom(prizes: typeof PRIZES) {
  const total = prizes.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= prizes[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

// FUNGSI HELPER AMBIL USER BERDASARKAN TELEGRAM ID
async function getUser(telegramId: string) {
  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  return user || null;
}

async function getOrCreateUser(telegramId: string, userData?: any) {
  if (!telegramId) return null;
  const user = await getUser(telegramId);
  if (user) return user;

  if (userData) {
    const [newUser] = await db.insert(users).values({
      telegramId: telegramId,
      name: userData.first_name || "Zetta Player",
      username: userData.username || "",
      avatar: userData.photo_url || "",
      coins: 0,
      usdtBalance: 0,
      zpBronze: 0,
      zpSilver: 0,
      zpGold: 0,
      zpDiamond: 0,
      qualifiedSilver: false,
      qualifiedGold: false,
      qualifiedDiamond: false
    }).returning();

    await db.insert(spinRecords).values({ userId: newUser.id });
    return newUser;
  }
  return null;
}

router.get("/user", async (req, res) => {
  try {
    const { telegramId, firstName, username, photoUrl } = req.query;
    const user = await getOrCreateUser(telegramId as string, {
      first_name: firstName,
      username: username,
      photo_url: photoUrl
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/user", async (req, res) => {
  try {
    const { telegramId, addCoins = 0, addZp = 0, room = "bronze" } = req.body;
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const zpMap: Record<string, any> = {
      bronze: "zpBronze",
      silver: "zpSilver",
      gold: "zpGold",
      diamond: "zpDiamond"
    };
    const targetCol = zpMap[room] || "zpBronze";

    const [updated] = await db.update(users)
      .set({ 
        coins: sql`${users.coins} + ${addCoins}`,
        [targetCol]: sql`${users[targetCol]} + ${addZp}`
      })
      .where(eq(users.telegramId, telegramId))
      .returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const telegramId = req.query.telegramId as string;
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db.select().from(taskCompletions).where(eq(taskCompletions.userId, user.id));
    const result = allTasks.map(t => ({
      ...t,
      completion: completions.find(c => c.taskId === t.id) || null
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { telegramId, taskId, screenshotUrl } = req.body;
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const [existing] = await db.select().from(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId))).limit(1);
    if (existing) return res.status(400).json({ error: "Already submitted" });

    const status = task.type === "screenshot" ? "pending" : "completed";
    const [completion] = await db.insert(taskCompletions).values({
      userId: user.id, taskId, status, screenshotUrl: screenshotUrl || null
    }).returning();

    if (status === "completed") {
      await db.update(users).set({ coins: sql`${users.coins} + ${task.rewardCoins}` }).where(eq(users.id, user.id));
    }
    res.json({ completion, rewardCoins: status === "completed" ? task.rewardCoins : 0 });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// MODIFIKASI OPERASI POST SPIN DI API SERVER EXPRESS LU
router.post("/spin", async (req, res) => {
  try {
    const { telegramId, spinType } = req.body; // Mengambil spinType ("premium" | "free" | "ads")
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = now - lastFree >= FREE_SPIN_COOLDOWN_MS;

    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;

    // VALIDASI GUARD SERVER EXPRESS
    if (spinType === "premium" && user.coins < 200) {
      return res.status(400).json({ error: "Insufficient coins" });
    }
    if (spinType === "free" && !isFreeAvailable) {
      return res.status(400).json({ error: "Free spin not available" });
    }
    if (spinType === "ads" && adsRemaining <= 0) {
      return res.status(400).json({ error: "No ads left" });
    }

    const prizeIndex = weightedRandom(PRIZES);
    const prize = PRIZES[prizeIndex];

    await db.transaction(async (tx) => {
      if (spinType === "ads") {
        await tx.update(spinRecords)
          .set({ adsSpinsToday: adsReset ? 1 : adsSpinsToday + 1, adsResetAt: adsReset ? new Date() : undefined })
          .where(eq(spinRecords.userId, user.id));
      } else if (spinType === "free") {
        await tx.update(spinRecords).set({ lastFreeSpinAt: new Date() }).where(eq(spinRecords.userId, user.id));
      }

      const premiumCost = spinType === "premium" ? 200 : 0;
      await tx.update(users).set({ 
        coins: sql`${users.coins} - ${premiumCost} + ${prize.coins}`,
        usdtBalance: sql`${users.usdtBalance} + ${prize.usdt}` 
      }).where(eq(users.id, user.id));

      await tx.insert(transactions).values({
        userId: user.id,
        type: "spin_reward",
        amount: prize.usdt > 0 ? String(prize.usdt) : String(prize.coins),
        currency: prize.usdt > 0 ? "USDT" : "COINS",
        status: "completed"
      });
    });

    res.json({ prize, prizeIndex });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/wallet", async (req, res) => {
  try {
    const telegramId = req.query.telegramId as string;
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const txHistory = await db.select().from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt)).limit(20);

    res.json({ 
      coins: user.coins, 
      usdtBalance: user.usdtBalance, 
      transactions: txHistory 
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/wallet", async (req, res) => {
  try {
    const { telegramId, method, amount, walletAddress } = req.body;
    const user = await getUser(telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const amtNum = parseFloat(amount);
    if (amtNum < 30) return res.status(400).json({ error: "Minimum withdraw $30 USDT" });
    if (user.usdtBalance < amtNum) return res.status(400).json({ error: "Saldo USDT tidak cukup" });

    await db.transaction(async (tx) => {
      await tx.update(users).set({ usdtBalance: sql`${users.usdtBalance} - ${amtNum}` }).where(eq(users.id, user.id));
      await tx.insert(transactions).values({
        userId: user.id,
        type: "withdrawal",
        amount: String(amtNum),
        currency: "USDT",
        method,
        walletAddress,
        status: "pending"
      });
    });

    res.json({ message: "Penarikan USDT sedang diproses" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;