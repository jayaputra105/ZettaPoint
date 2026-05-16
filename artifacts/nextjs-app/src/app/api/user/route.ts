import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    
    if (!telegramId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    const firstName = searchParams.get("firstName") || "Zetta Player";
    const username = searchParams.get("username") || "";
    const photoUrl = searchParams.get("photoUrl") || "";
    
    // LOGIC UPSERT: Jika belum ada -> INSERT. Jika sudah ada -> UPDATE Nama & Username.
    const [user] = await db.insert(users)
      .values({
        telegramId: telegramId.toString(),
        name: firstName,
        username: username,
        avatar: photoUrl,
        coins: 0,
        usdtBalance: 0,
        zpBronze: 0,
        zpSilver: 0,
        zpGold: 0,
        zpDiamond: 0,
        qualifiedSilver: false,
        qualifiedGold: false,
        qualifiedDiamond: false
      })
      .onConflictDoUpdate({
        target: users.telegramId, // Berdasarkan kolom telegramId yang unik
        set: {
          // Update info profil setiap kali user login/sync 
          name: firstName,
          username: username,
          avatar: photoUrl
        }
      })
      .returning();
    
    return NextResponse.json(user);
  } catch (e) {
    console.error("GET User Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

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