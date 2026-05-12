import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const MOCK_TELEGRAM_ID = "mock_001";
const MIN_WITHDRAW_COINS = 10000;

export async function GET() {
  try {
    const [user] = await db.select().from(users).where(eq(users.telegramId, MOCK_TELEGRAM_ID)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const txHistory = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    const usdtBalance = txHistory
      .filter((t) => t.type === "spin_reward" && t.currency === "USDT" && t.status === "completed")
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    return NextResponse.json({
      coins: user.coins,
      usdtBalance: Math.round(usdtBalance * 100) / 100,
      minWithdrawCoins: MIN_WITHDRAW_COINS,
      transactions: txHistory,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { method, amount, walletAddress, currency } = body;

    const [user] = await db.select().from(users).where(eq(users.telegramId, MOCK_TELEGRAM_ID)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (currency === "COINS") {
      const amtNum = parseInt(amount);
      if (amtNum < MIN_WITHDRAW_COINS) {
        return NextResponse.json({ error: `Minimum withdraw ${MIN_WITHDRAW_COINS.toLocaleString()} koin` }, { status: 400 });
      }
      if (user.coins < amtNum) {
        return NextResponse.json({ error: "Saldo koin tidak cukup" }, { status: 400 });
      }
      await db.update(users).set({ coins: user.coins - amtNum }).where(eq(users.id, user.id));
    }

    const [tx] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        type: "withdrawal",
        amount: String(amount),
        currency,
        method,
        walletAddress,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ transaction: tx, message: "Permintaan penarikan sedang diproses" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
