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
    
    // LOGIC UPSERT: Aman, tidak merusak data lama jika user sudah terdaftar
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
        target: users.telegramId,
        set: {
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
    
    // PERBAIKAN 1: Map langsung ke nama properti camelCase di schema TypeScript lu
    const roomKeyMap: Record < string, "zpBronze" | "zpSilver" | "zpGold" | "zpDiamond" > = {
      bronze: "zpBronze",
      silver: "zpSilver",
      gold: "zpGold",
      diamond: "zpDiamond"
    };
    
    const targetKey = roomKeyMap[room] || "zpBronze";
    
    // PERBAIKAN 2: Map kolom Drizzle secara presisi untuk kebutuhan SQL statement
    const dslColumnMap: Record < string, any > = {
      zpBronze: users.zpBronze,
      zpSilver: users.zpSilver,
      zpGold: users.zpGold,
      zpDiamond: users.zpDiamond
    };
    
    const targetZpCol = dslColumnMap[targetKey];
    
    const [updated] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${addCoins ?? 0}`,
        // Menggunakan key TypeScript ([targetKey]) untuk Drizzle, 
        // dan referensi kolom asli (targetZpCol) di dalam raw SQL increment-nya
        [targetKey]: sql`${targetZpCol} + ${addZp ?? 0}`
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