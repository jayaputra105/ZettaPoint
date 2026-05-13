import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const tid = new URL(req.url).searchParams.get("telegramId");
  const [user] = await db.select().from(users).where(eq(users.telegramId, tid!)).limit(1);
  const tx = await db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.createdAt)).limit(20);
  
  return NextResponse.json({
    coins: user.coins,
    zp: user.zp,
    usdtBalance: user.usdtBalance,
    transactions: tx
  });
}

export async function POST(req: Request) {
  const { telegramId, method, amount, walletAddress } = await req.json();
  const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

  if (user.usdtBalance < amount || amount < 30) return NextResponse.json({ error: "Saldo kurang / Min WD 30" }, { status: 400 });

  await db.transaction(async (itx) => {
    await itx.update(users).set({ usdtBalance: sql`${users.usdtBalance} - ${amount}` }).where(eq(users.id, user.id));
    await itx.insert(transactions).values({
      userId: user.id, type: "withdrawal", amount: String(amount), currency: "USDT", method, walletAddress, status: "pending"
    });
  });

  return NextResponse.json({ success: true });
}