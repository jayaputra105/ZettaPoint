import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq, sql, and, isNull } from "drizzle-orm";

const router = Router();

const REFERRAL_TIER1_BONUS = 1500;
const REFERRAL_TIER2_BONUS = 500;

router.post("/", async (req, res) => {
  try {
    const { telegramId, referrerTelegramId } = req.body;

    if (!telegramId || !referrerTelegramId) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    if (telegramId === referrerTelegramId) {
      return res.status(400).json({ error: "Cannot refer yourself" });
    }

    const [newUser] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!newUser) return res.status(404).json({ error: "User not found" });

    if (newUser.referrerId !== null) {
      return res.status(400).json({ error: "Referral already processed" });
    }

    const [referrer] = await db.select().from(users).where(eq(users.telegramId, referrerTelegramId)).limit(1);
    if (!referrer) return res.status(404).json({ error: "Referrer not found" });

    await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ referrerId: referrer.id })
        .where(eq(users.id, newUser.id));

      await tx.update(users)
        .set({ coins: sql`${users.coins} + ${REFERRAL_TIER1_BONUS}` })
        .where(eq(users.id, referrer.id));

      if (referrer.referrerId) {
        await tx.update(users)
          .set({ coins: sql`${users.coins} + ${REFERRAL_TIER2_BONUS}` })
          .where(eq(users.id, referrer.referrerId));
      }
    });

    return res.json({
      success: true,
      referrerId: referrer.id,
      bonusGiven: REFERRAL_TIER1_BONUS,
    });
  } catch (e) {
    console.error("Referral Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

router.get("/count", async (req, res) => {
  try {
    const { telegramId } = req.query as Record<string, string>;
    if (!telegramId) return res.status(400).json({ error: "Missing telegramId" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "Not found" });

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.referrerId, user.id));

    return res.json({ referralCount: Number(row?.count ?? 0), userId: user.id });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
