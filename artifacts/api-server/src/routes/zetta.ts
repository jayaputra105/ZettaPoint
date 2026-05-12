import { Router } from "express";
import { db, users, tasks, taskCompletions, spinRecords, transactions } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

const MOCK_TELEGRAM_ID = "mock_001";
const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ADS_SPINS = 5;
const MIN_WITHDRAW_COINS = 10000;

const PRIZES = [
  { label: "50 Koin", coins: 50, usdt: 0, weight: 35 },
  { label: "100 Koin", coins: 100, usdt: 0, weight: 25 },
  { label: "200 Koin", coins: 200, usdt: 0, weight: 18 },
  { label: "500 Koin", coins: 500, usdt: 0, weight: 12 },
  { label: "1000 Koin", coins: 1000, usdt: 0, weight: 7 },
  { label: "0.1 USDT", coins: 0, usdt: 0.1, weight: 3 },
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

async function getMockUser() {
  const [user] = await db.select().from(users).where(eq(users.telegramId, MOCK_TELEGRAM_ID)).limit(1);
  return user ?? null;
}

router.get("/user", async (req, res) => {
  try {
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.patch("/user", async (req, res) => {
  try {
    const { addCoins = 0 } = req.body;
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const [updated] = await db
      .update(users)
      .set({ coins: user.coins + addCoins })
      .where(eq(users.telegramId, MOCK_TELEGRAM_ID))
      .returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db.select().from(taskCompletions).where(eq(taskCompletions.userId, user.id));
    const completionMap = Object.fromEntries(completions.map((c) => [c.taskId, c]));
    const result = allTasks.map((t) => ({ ...t, completion: completionMap[t.id] ?? null }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const { taskId, screenshotUrl } = req.body;
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const existing = await db
      .select()
      .from(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
      .limit(1);
    if (existing.length > 0) return res.status(400).json({ error: "Already submitted" });
    const status = task.type === "screenshot" ? "pending" : "completed";
    const [completion] = await db
      .insert(taskCompletions)
      .values({ userId: user.id, taskId, status, screenshotUrl: screenshotUrl ?? null })
      .returning();
    if (status === "completed") {
      await db.update(users).set({ coins: user.coins + task.rewardCoins }).where(eq(users.id, user.id));
    }
    res.json({ completion, rewardCoins: status === "completed" ? task.rewardCoins : 0 });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/spin", async (req, res) => {
  try {
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = now - lastFree >= FREE_SPIN_COOLDOWN_MS;
    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;
    res.json({
      isFreeAvailable,
      adsRemaining,
      maxAds: MAX_ADS_SPINS,
      nextFreeIn: isFreeAvailable ? 0 : FREE_SPIN_COOLDOWN_MS - (now - lastFree),
      prizes: PRIZES.map((p, i) => ({ ...p, index: i })),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/spin", async (req, res) => {
  try {
    const { useAd } = req.body;
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = now - lastFree >= FREE_SPIN_COOLDOWN_MS;
    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;
    if (!useAd && !isFreeAvailable) return res.status(400).json({ error: "Free spin not available yet" });
    if (useAd && adsRemaining <= 0) return res.status(400).json({ error: "No ads spins left today" });
    const prizeIndex = weightedRandom(PRIZES);
    const prize = PRIZES[prizeIndex];
    if (useAd) {
      await db.update(spinRecords).set({ adsSpinsToday: adsReset ? 1 : adsSpinsToday + 1, adsResetAt: adsReset ? new Date() : undefined }).where(eq(spinRecords.userId, user.id));
    } else {
      await db.update(spinRecords).set({ lastFreeSpinAt: new Date() }).where(eq(spinRecords.userId, user.id));
    }
    await db.update(users).set({ coins: user.coins + prize.coins }).where(eq(users.id, user.id));
    await db.insert(transactions).values({ userId: user.id, type: "spin_reward", amount: prize.usdt > 0 ? String(prize.usdt) : String(prize.coins), currency: prize.usdt > 0 ? "USDT" : "COINS", status: "completed" });
    res.json({ prize, prizeIndex, newCoins: user.coins + prize.coins });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const top = await db.select({ id: users.id, name: users.name, username: users.username, avatar: users.avatar, coins: users.coins, rank: users.rank }).from(users).orderBy(desc(users.coins)).limit(100);
    res.json(top.map((u, i) => ({ ...u, position: i + 1 })));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/wallet", async (req, res) => {
  try {
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    const txHistory = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt)).limit(20);
    const usdtBalance = txHistory.filter((t) => t.type === "spin_reward" && t.currency === "USDT" && t.status === "completed").reduce((s, t) => s + parseFloat(t.amount), 0);
    res.json({ coins: user.coins, usdtBalance: Math.round(usdtBalance * 100) / 100, minWithdrawCoins: MIN_WITHDRAW_COINS, transactions: txHistory });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.post("/wallet", async (req, res) => {
  try {
    const { method, amount, walletAddress, currency } = req.body;
    const user = await getMockUser();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (currency === "COINS") {
      const amtNum = parseInt(amount);
      if (amtNum < MIN_WITHDRAW_COINS) return res.status(400).json({ error: `Minimum withdraw ${MIN_WITHDRAW_COINS.toLocaleString()} koin` });
      if (user.coins < amtNum) return res.status(400).json({ error: "Saldo koin tidak cukup" });
      await db.update(users).set({ coins: user.coins - amtNum }).where(eq(users.id, user.id));
    }
    const [tx] = await db.insert(transactions).values({ userId: user.id, type: "withdrawal", amount: String(amount), currency, method, walletAddress, status: "pending" }).returning();
    res.json({ transaction: tx, message: "Permintaan penarikan sedang diproses" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
