import { NextResponse } from "next/server";
import { db } from "@/db";
import { spinRecords, users, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ADS_SPINS = 5;

// MATRIX 12 SEKTOR PAS DAN AKURAT DI BACKEND SINKRON 1:1 DENGAN FRONTEND
const PRIZES = [
  { label: "50 Koin", coins: 50, usdt: 0, weight: 14.2 },
  { label: "150 Koin", coins: 150, usdt: 0, weight: 20.0 },
  { label: "300 Koin", coins: 300, usdt: 0, weight: 25.0 },
  { label: "500 Koin", coins: 500, usdt: 0, weight: 18.0 },
  { label: "1000 Koin", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "5 USDT", coins: 0, usdt: 5, weight: 0.2 },
  { label: "25 USDT", coins: 0, usdt: 25, weight: 0.0 }, // Jimat Pajangan Kasino 0%
  { label: "1 USDT", coins: 0, usdt: 1, weight: 1.0 },
  { label: "1000 Koin", coins: 1000, usdt: 0, weight: 5.0 },
  { label: "500 Koin", coins: 500, usdt: 0, weight: 5.6 },
  { label: "300 Koin", coins: 300, usdt: 0, weight: 5.0 },
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tid = searchParams.get("telegramId");
    
    if (!tid) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, tid)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
    
    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = now - lastFree >= FREE_SPIN_COOLDOWN_MS;
    
    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;
    
    return NextResponse.json({
      isFreeAvailable,
      adsRemaining,
      maxAds: MAX_ADS_SPINS,
      nextFreeIn: isFreeAvailable ? 0 : FREE_SPIN_COOLDOWN_MS - (now - lastFree),
      prizes: PRIZES.map((p, i) => ({ ...p, index: i })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { spinType, telegramId } = body;
    
    if (!telegramId) return NextResponse.json({ error: "No telegram ID" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
    
    const now = Date.now();
    const lastFree = spin?.lastFreeSpinAt ? new Date(spin.lastFreeSpinAt).getTime() : 0;
    const isFreeAvailable = now - lastFree >= FREE_SPIN_COOLDOWN_MS;
    
    const adsResetAt = spin?.adsResetAt ? new Date(spin.adsResetAt).getTime() : 0;
    const adsReset = now - adsResetAt >= FREE_SPIN_COOLDOWN_MS;
    const adsSpinsToday = adsReset ? 0 : (spin?.adsSpinsToday ?? 0);
    const adsRemaining = MAX_ADS_SPINS - adsSpinsToday;
    
    if (spinType === "premium" && user.coins < 200) {
      return NextResponse.json({ error: "Insufficient coins! Premium spin costs 200 Coins." }, { status: 400 });
    }
    if (spinType === "free" && !isFreeAvailable) {
      return NextResponse.json({ error: "Free spin not available yet" }, { status: 400 });
    }
    if (spinType === "ads" && adsRemaining <= 0) {
      return NextResponse.json({ error: "No ads left for today" }, { status: 400 });
    }
    
    const prizeIndex = weightedRandom(PRIZES);
    const prize = PRIZES[prizeIndex];
    
    await db.transaction(async (tx) => {
      if (spinType === "ads") {
        await tx.update(spinRecords)
          .set({ adsSpinsToday: adsReset ? 1 : adsSpinsToday + 1, adsResetAt: adsReset ? new Date() : undefined })
          .where(eq(spinRecords.userId, user.id));
      } else if (spinType === "free") {
        await tx.update(spinRecords).set({ lastFreeSpinAt: new Date() }).where(eq(spinRecords.userId, user.id));
      }
      
      const premiumCost = spinType === "premium" ? 200 : 0;
      await tx.update(users).set({
        coins: sql`${users.coins} - ${premiumCost} + ${prize.coins}`,
        usdtBalance: sql`${users.usdtBalance} + ${prize.usdt}`
      }).where(eq(users.id, user.id));
      
      await tx.insert(transactions).values({
        userId: user.id,
        type: "spin_reward",
        amount: prize.usdt > 0 ? String(prize.usdt) : String(prize.coins),
        currency: prize.usdt > 0 ? "USDT" : "COINS",
        status: "completed",
      });
    });
    
    return NextResponse.json({ prize, prizeIndex });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}