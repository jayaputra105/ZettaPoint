import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { telegramId, firstName, username, photoUrl } = req.query as Record<string, string>;
    if (!telegramId) return res.status(400).json({ error: "Missing ID" });

    const [user] = await db
      .insert(users)
      .values({
        telegramId: telegramId.toString(),
        name: firstName || "Zetta Player",
        username: username || "",
        avatar: photoUrl || "",
        coins: 0,
        usdtBalance: 0,
        zpBronze: 0,
        zpSilver: 0,
        zpGold: 0,
        zpDiamond: 0,
        qualifiedSilver: false,
        qualifiedGold: false,
        qualifiedDiamond: false,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          name: firstName || "Zetta Player",
          username: username || "",
          avatar: photoUrl || "",
        },
      })
      .returning();

    return res.json(user);
  } catch (e) {
    console.error("GET User Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

router.patch("/", async (req, res) => {
  try {
    const { telegramId, addZp, addCoins, room } = req.body;
    if (!telegramId) return res.status(400).json({ error: "No Telegram ID" });

    const roomKeyMap: Record<string, "zpBronze" | "zpSilver" | "zpGold" | "zpDiamond"> = {
      bronze: "zpBronze",
      silver: "zpSilver",
      gold: "zpGold",
      diamond: "zpDiamond",
    };

    const targetKey = roomKeyMap[room] || "zpBronze";

    const dslColumnMap: Record<string, any> = {
      zpBronze: users.zpBronze,
      zpSilver: users.zpSilver,
      zpGold: users.zpGold,
      zpDiamond: users.zpDiamond,
    };

    const targetZpCol = dslColumnMap[targetKey];

    const [updated] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${addCoins ?? 0}`,
        [targetKey]: sql`${targetZpCol} + ${addZp ?? 0}`,
      })
      .where(eq(users.telegramId, telegramId.toString()))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json(updated);
  } catch (e) {
    console.error("PATCH Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

router.patch("/wallet", async (req, res) => {
  try {
    const { telegramId, tonWalletAddress } = req.body;
    if (!telegramId) return res.status(400).json({ error: "Missing Telegram ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const [updated] = await db
      .update(users)
      .set({ tonWalletAddress: tonWalletAddress || null })
      .where(eq(users.telegramId, telegramId))
      .returning();

    return res.json({ success: true, tonWalletAddress: updated.tonWalletAddress });
  } catch (e) {
    console.error("PATCH wallet Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
