import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET USER DATA (Untuk Sync ke AppProvider)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    
    if (!telegramId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// REGISTER / LOGIN
export async function POST(req: Request) {
  try {
    const { telegramId, name, username } = await req.json();
    
    if (!telegramId) return NextResponse.json({ error: "Missing Telegram ID" }, { status: 400 });
    
    let [user] = await db.select().from(users).where(eq(users.telegramId, telegramId.toString())).limit(1);
    
    if (!user) {
      const inserted = await db.insert(users).values({
        telegramId: telegramId.toString(),
        name: name || "Zetta Player",
        username: username || "",
        coins: 0,
        usdtBalance: 0,
        zp: 0,
        // Default kualifikasi
        qualifiedSilver: false,
        qualifiedGold: false,
        qualifiedDiamond: false
      }).returning();
      user = inserted[0];
    }
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


export async function PATCH(req: Request) {
  try {
    const { telegramId, addCoins } = await req.json();

    if (!telegramId) return NextResponse.json({ error: "No Telegram ID" }, { status: 400 });

    const updated = await db
      .update(users)
      .set({ 
        coins: sql`${users.coins} + ${addCoins ?? 0}` 
      })
      .where(eq(users.telegramId, telegramId.toString()))
      .returning();

    if (updated.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}