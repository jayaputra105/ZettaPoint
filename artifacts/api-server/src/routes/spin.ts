import { Router } from "express";
import { db } from "@workspace/db";
import { spinRecords, users, transactions } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ADS_SPINS = 5;

const PRIZES = [
  { label: "50 Coins", coins: 50, usdt: 0, weight: 14.2 },
  { label: "150 Coins", coins: 150, usdt: 0, weight: 20.0 },
  { label: "300 Coins", coins: 300, usdt: 0, weight: 25.0 },
  { label: "500 Coins", coins: 500, usdt: 0, weight: 18.0 },
  { label: "1000 Coins", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "5 USDT", coins: 0, usdt: 5, weight: 0.2 },
  { label: "25 USDT", coins: 0, usdt: 25, weight: 0.0 },
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "1000 Coins", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "500 Coins", coins: 500, usdt: 0, weight: 5.6 },
  { label: "300 Coins", coins: 300, usdt: 0, weight: 5.0 },
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

router.get("/", async (req, res) => {
  try {
    const tid = req.query.telegramId as string;
    if (!tid) return res.status(400).json({ error: "Missing ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, tid)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);

    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = !spin || now - lastFree >= FREE_SPIN_COOLDOWN_MS;

    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = !spin || now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;

    return res.json({
      isFreeAvailable,
      adsRemaining,
      maxAds: MAX_ADS_SPINS,
      nextFreeIn: isFreeAvailable ? 0 : FREE_SPIN_COOLDOWN_MS - (now - lastFree),
      prizes: PRIZES.map((p, i) => ({ ...p, index: i })),
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { spinType, telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: "No telegram ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);

    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = !spin || now - lastFree >= FREE_SPIN_COOLDOWN_MS;

    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = !spin || now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;

    if (spinType === "premium" && user.coins < 200) {
      return res.status(400).json({ error: "Insufficient coins! Premium spin costs 200 Coins." });
    }
    if (spinType === "free" && !isFreeAvailable) {
      return res.status(400).json({ error: "Free spin not available yet" });
    }
    if (spinType === "ads" && adsRemaining <= 0) {
      return res.status(400).json({ error: "No ads left for today" });
    }

    const prizeIndex = weightedRandom(PRIZES);
    const prize = PRIZES[prizeIndex];

    await db.transaction(async (tx) => {
      if (spin) {
        if (spinType === "ads") {
          await tx
            .update(spinRecords)
            .set({
              adsSpinsToday: adsReset ? 1 : adsSpinsToday + 1,
              adsResetAt: adsReset ? new Date() : undefined,
            })
            .where(eq(spinRecords.userId, user.id));
        } else if (spinType === "free") {
          await tx
            .update(spinRecords)
            .set({ lastFreeSpinAt: new Date() })
            .where(eq(spinRecords.userId, user.id));
        }
      } else {
        await tx.insert(spinRecords).values({
          userId: user.id,
          lastFreeSpinAt: spinType === "free" ? new Date() : undefined,
          adsSpinsToday: spinType === "ads" ? 1 : 0,
          adsResetAt: spinType === "ads" ? new Date() : undefined,
        });
      }

      const premiumCost = spinType === "premium" ? 200 : 0;
      await tx
        .update(users)
        .set({
          coins: sql`${users.coins} - ${premiumCost} + ${prize.coins}`,
          usdtBalance: sql`${users.usdtBalance} + ${prize.usdt}`,
        })
        .where(eq(users.id, user.id));

      await tx.insert(transactions).values({
        userId: user.id,
        type: "spin_reward",
        amount: prize.usdt > 0 ? String(prize.usdt) : String(prize.coins),
        currency: prize.usdt > 0 ? "USDT" : "COINS",
        status: "completed",
      });
    });

    return res.json({ prize, prizeIndex });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
