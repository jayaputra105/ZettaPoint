import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// 1. GET USER DATA (Auto-Register if not found)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    
    if (!telegramId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    // Cari user
    let [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    
    // --- LOGIC PENYELAMAT: Kalau gak ada, kita buatin sekarang juga ---
    if (!user) {
      const name = searchParams.get("firstName") || "Zetta Player";
      const username = searchParams.get("username") || "";
      const avatar = searchParams.get("photoUrl") || "";
      
      const inserted = await db.insert(users).values({
        telegramId: telegramId.toString(),
        name: name,
        username: username,
        avatar: avatar,
        coins: 0,
        usdtBalance: 0,
        zpBronze: 0,
        zpSilver: 0,
        zpGold: 0,
        zpDiamond: 0,
        qualifiedSilver: false,
        qualifiedGold: false,
        qualifiedDiamond: false
      }).returning();
      
      user = inserted[0];
    }
    
    return NextResponse.json(user);
  } catch (e) {
    console.error("GET User Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// 2. UPDATE DATA (PATCH) - Tetap seperti ini, sudah bagus
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, addZp, addCoins, room } = body;
    
    if (!telegramId) return NextResponse.json({ error: "No Telegram ID" }, { status: 400 });
    
    const zpColumnMap: Record < string, any > = {
      bronze: users.zpBronze,
      silver: users.zpSilver,
      gold: users.zpGold,
      diamond: users.zpDiamond
    };
    
    const targetZpCol = zpColumnMap[room] || users.zpBronze;
    
    const [updated] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${addCoins ?? 0}`,
        [targetZpCol.name]: sql`${targetZpCol} + ${addZp ?? 0}`
      })
      .where(eq(users.telegramId, telegramId.toString()))
      .returning();
    
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}