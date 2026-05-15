import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const tid = new URL(req.url).searchParams.get("telegramId");
    if (!tid) return NextResponse.json({ error: "No ID" }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.telegramId, tid)).limit(1);
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // AMBIL SEMUA ZP DARI TIAP ROOM & JUMLAHKAN (Logic Sinkron Database Baru)
    const totalZp = (user.zpBronze || 0) + (user.zpSilver || 0) + (user.zpGold || 0) + (user.zpDiamond || 0);

    const tx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(20);
    
    return NextResponse.json({
      coins: user.coins,
      zp: totalZp, // Kirim sebagai 'zp' biar page Wallet lu gak perlu ganti variabel
      usdtBalance: user.usdtBalance,
      transactions: tx
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { telegramId, method, amount, walletAddress } = await req.json();
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Cek Saldo & Minimal WD
    if (user.usdtBalance < amount || amount < 30) {
      return NextResponse.json({ error: "Saldo kurang / Min WD 30" }, { status: 400 });
    }

    await db.transaction(async (itx) => {
      // 1. Kurangi Saldo USDT
      await itx.update(users)
        .set({ usdtBalance: sql`${users.usdtBalance} - ${amount}` })
        .where(eq(users.id, user.id));

      // 2. Catat Transaksi Withdrawal
      await itx.insert(transactions).values({
        userId: user.id,
        type: "withdrawal",
        amount: String(amount),
        currency: "USDT",
        method: method,
        walletAddress: walletAddress,
        status: "pending"
      });
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}