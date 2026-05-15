import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") || "bronze";
    
    // Mapping kolom ZP berdasarkan room yang diminta frontend
    const zpColumnMap: Record < string, any > = {
      bronze: users.zpBronze,
      silver: users.zpSilver,
      gold: users.zpGold,
      diamond: users.zpDiamond,
    };
    
    const targetZpCol = zpColumnMap[room] || users.zpBronze;
    
    const top = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        zp: targetZpCol, // Ambil nilai dari kolom room yang dipilih
      })
      .from(users)
      .where(sql`${targetZpCol} > 0`) // Hanya tampilkan yang sudah punya poin
      .orderBy(desc(targetZpCol))
      .limit(100);
    
    const withRank = top.map((u, i) => ({
      ...u,
      position: i + 1
    }));
    
    return NextResponse.json(withRank);
  } catch (e) {
    console.error("Leaderboard API Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}