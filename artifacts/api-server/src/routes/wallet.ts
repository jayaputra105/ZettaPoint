import { Router } from "express";
import { db } from "@workspace/db";
import { users, transactions } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const tid = req.query.telegramId as string;
    if (!tid) return res.status(400).json({ error: "Missing Telegram ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, tid)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const totalZp =
      (Number(user.zpBronze) || 0) +
      (Number(user.zpSilver) || 0) +
      (Number(user.zpGold) || 0) +
      (Number(user.zpDiamond) || 0);

    const tx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    return res.json({
      coins: user.coins,
      zp: totalZp,
      usdtBalance: user.usdtBalance,
      transactions: tx || [],
    });
  } catch (e) {
    console.error("Wallet GET Error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { telegramId, method, amount, walletAddress } = req.body;
    if (!telegramId) return res.status(400).json({ error: "No Telegram ID" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const wdAmount = parseFloat(amount);
    if (isNaN(wdAmount) || wdAmount < 30) {
      return res.status(400).json({ error: "Minimum withdrawal is $30 USDT" });
    }
    if (user.usdtBalance < wdAmount) {
      return res.status(400).json({ error: "Insufficient USDT balance" });
    }

    const newTransaction = await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ usdtBalance: sql`${users.usdtBalance} - ${wdAmount}` })
        .where(eq(users.id, user.id));

      const [newTx] = await tx
        .insert(transactions)
        .values({
          userId: user.id,
          type: "withdrawal",
          amount: String(wdAmount),
          currency: "USDT",
          method: method || "Unknown",
          walletAddress: walletAddress || "N/A",
          status: "pending",
        })
        .returning();

      return newTx;
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      const teksNotif =
        `🚨 *NEW WITHDRAWAL REQUEST* 🚨\n\n` +
        `👤 *User:* ${user.name} (@${user.username || "N/A"})\n` +
        `🆔 *Telegram ID:* \`${user.telegramId}\`\n` +
        `🎟️ *TX ID:* #${newTransaction.id}\n` +
        `💰 *Amount:* $${wdAmount} USDT\n` +
        `🌐 *Network:* ${method || "Unknown"}\n` +
        `📥 *Address:* \`${walletAddress || "N/A"}\``;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: teksNotif,
          parse_mode: "Markdown",
        }),
      }).catch((err) => console.error("Failed to notify admin:", err));
    }

    return res.json({
      success: true,
      message: "Withdrawal request pending review",
      transaction: newTransaction,
    });
  } catch (e) {
    console.error("Wallet POST Error:", e);
    return res.status(500).json({ error: "Withdrawal failed" });
  }
});

export default router;
