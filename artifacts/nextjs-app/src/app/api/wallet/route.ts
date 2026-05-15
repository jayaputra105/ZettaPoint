import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

// 1. GET DATA WALLET (Coins, Total ZP, USDT Balance, History)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tid = searchParams.get("telegramId");

    if (!tid) return NextResponse.json({ error: "Missing Telegram ID" }, { status: 400 });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tid))
      .limit(1);
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // HITUNG TOTAL ZP (Gabungan dari semua room)
    const totalZp = 
      (Number(user.zpBronze) || 0) + 
      (Number(user.zpSilver) || 0) + 
      (Number(user.zpGold) || 0) + 
      (Number(user.zpDiamond) || 0);

    // AMBIL HISTORY TRANSAKSI (20 Terakhir)
    const tx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
      .limit(20);
    
    return NextResponse.json({
      coins: user.coins,
      zp: totalZp, // Dikirim sebagai 'zp' agar sinkron dengan frontend lama
      usdtBalance: user.usdtBalance,
      transactions: tx || []
    });
  } catch (e) {
    console.error("Wallet GET Error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. REQUEST WITHDRAWAL (USDT ONLY)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, method, amount, walletAddress } = body;

    if (!telegramId) return NextResponse.json({ error: "No Telegram ID" }, { status: 400 });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const wdAmount = parseFloat(amount);

    // VALIDASI SALDO & MINIMAL WITHDRAW
    if (isNaN(wdAmount) || wdAmount < 30) {
      return NextResponse.json({ error: "Minimum withdrawal is $30 USDT" }, { status: 400 });
    }
    
    if (user.usdtBalance < wdAmount) {
      return NextResponse.json({ error: "Insufficient USDT balance" }, { status: 400 });
    }

    // DATABASE TRANSACTION (Atomic Update)
    const result = await db.transaction(async (tx) => {
      // Potong Saldo USDT User
      await tx
        .update(users)
        .set({ usdtBalance: sql`${users.usdtBalance} - ${wdAmount}` })
        .where(eq(users.id, user.id));

      // Masukkan ke Tabel Transaksi
      const [newTx] = await tx.insert(transactions).values({
        userId: user.id,
        type: "withdrawal",
        amount: String(wdAmount),
        currency: "USDT",
        method: method || "Unknown",
        walletAddress: walletAddress || "N/A",
        status: "pending", // Akan di-review manual oleh lu sebagai admin
      }).returning();

      return newTx;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal request pending review",
      transaction: result 
    });
  } catch (e) {
    console.error("Wallet POST Error:", e);
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 });
  }
}