import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

const MULTIPLIER_TIERS = [
  { level: 1, multiplier: 1.1, cost: 300 },
  { level: 2, multiplier: 1.2, cost: 600 },
  { level: 3, multiplier: 1.3, cost: 1000 },
  { level: 4, multiplier: 1.4, cost: 1500 },
  { level: 5, multiplier: 1.5, cost: 2500 },
  { level: 6, multiplier: 1.6, cost: 4000 },
  { level: 7, multiplier: 1.7, cost: 6000 },
  { level: 8, multiplier: 1.8, cost: 9000 },
  { level: 9, multiplier: 1.9, cost: 13000 },
  { level: 10, multiplier: 2.0, cost: 18000 },
  { level: 11, multiplier: 2.1, cost: 25000 },
  { level: 12, multiplier: 2.2, cost: 35000 },
  { level: 13, multiplier: 2.3, cost: 48000 },
  { level: 14, multiplier: 2.4, cost: 65000 },
  { level: 15, multiplier: 2.5, cost: 85000 },
  { level: 16, multiplier: 2.6, cost: 110000 },
  { level: 17, multiplier: 2.7, cost: 140000 },
  { level: 18, multiplier: 2.8, cost: 175000 },
  { level: 19, multiplier: 2.9, cost: 215000 },
  { level: 20, multiplier: 3.0, cost: 260000 },
];

function getMultiplierValue(level: number): number {
  if (level <= 0) return 1.0;
  if (level >= 20) return 3.0;
  return MULTIPLIER_TIERS[level - 1].multiplier;
}

function isSameUTCDay(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

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
        multiplierLevel: 0,
        autoClickEnabled: false,
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

    let result = user;

    if (result.multiplierLevel > 0 && !isSameUTCDay(result.multiplierResetAt)) {
      const [reset] = await db
        .update(users)
        .set({ multiplierLevel: 0, multiplierResetAt: null })
        .where(eq(users.telegramId, telegramId))
        .returning();
      result = reset;
    }

    return res.json({
      ...result,
      multiplierValue: getMultiplierValue(result.multiplierLevel),
    });
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

router.patch("/multiplier", async (req, res) => {
  try {
    const { telegramId, targetLevel } = req.body;
    if (!telegramId) return res.status(400).json({ error: "Missing Telegram ID" });
    if (!targetLevel || targetLevel < 1 || targetLevel > 20) {
      return res.status(400).json({ error: "Invalid target level" });
    }

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    let currentLevel = user.multiplierLevel;
    if (currentLevel > 0 && !isSameUTCDay(user.multiplierResetAt)) {
      currentLevel = 0;
    }

    if (targetLevel !== currentLevel + 1) {
      return res.status(400).json({ error: `Must buy level ${currentLevel + 1} next` });
    }

    const tier = MULTIPLIER_TIERS[targetLevel - 1];
    if (user.coins < tier.cost) {
      return res.status(400).json({ error: "Insufficient coins" });
    }

    const [updated] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} - ${tier.cost}`,
        multiplierLevel: targetLevel,
        multiplierResetAt: new Date(),
      })
      .where(eq(users.telegramId, telegramId))
      .returning();

    return res.json({
      ...updated,
      multiplierValue: getMultiplierValue(updated.multiplierLevel),
    });
  } catch (e) {
    console.error("PATCH multiplier Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

router.post("/auto-click/invoice", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: "Missing Telegram ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.autoClickEnabled) return res.status(400).json({ error: "Already enabled" });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(503).json({ error: "Bot token not configured. Contact admin." });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Automatic free clicks every hour",
        description: " ",
        payload: `auto_click_${telegramId}`,
        currency: "XTR",
        prices: [{ label: "Auto Click", amount: 150 }],
      }),
    });

    const tgData = (await tgRes.json()) as { ok: boolean; description?: string; result?: string };

    if (!tgData.ok) {
      console.error("Telegram invoice error:", tgData);
      return res.status(500).json({ error: tgData.description || "Failed to create invoice" });
    }

    return res.json({ invoiceUrl: tgData.result });
  } catch (e) {
    console.error("Auto-click invoice Error:", e);
    return res.status(500).json({ error: String(e) });
  }
}); // <--- PENUTUP INVOICE (PASTIKAN INI ADA)

router.post("/auto-click/activate", async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: "Missing Telegram ID" });

    const [updated] = await db
      .update(users)
      .set({ autoClickEnabled: true })
      .where(eq(users.telegramId, telegramId))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ success: true, autoClickEnabled: true });
  } catch (e) {
    console.error("Auto-click activate Error:", e);
    return res.status(500).json({ error: String(e) });
  }
}); 

export default router;
