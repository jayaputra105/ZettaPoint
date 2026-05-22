import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners, transactions } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("id");
  const authHeader = req.headers.get('authorization');

  // --- MODE PUBLIC (Untuk Leaderboard UI) ---
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (roomId) {
      const roomData = await db.select().from(rooms).where(eq(rooms.id, roomId));
      if (roomData.length > 0) {
        const now = new Date();
        const resetTime = new Date(roomData[0].resetAt);
        const remainingMs = Math.max(0, resetTime.getTime() - now.getTime());
        return NextResponse.json({ 
          remainingMs, 
          prizePool: roomData[0].prizePool 
        });
      }
    }
    return new Response('Unauthorized', { status: 401 });
  }

  // --- MODE CRON JOB (Reset Otomatis) ---
  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      if (now >= new Date(room.resetAt)) {
        const zpColumnMap: Record<string, any> = {
          bronze: users.zpBronze, silver: users.zpSilver,
          gold: users.zpGold, diamond: users.zpDiamond
        };
        const activeZpCol = zpColumnMap[room.id];
        
        const topPlayers = await db.select().from(users).where(sql`${activeZpCol} > 0`).orderBy(desc(activeZpCol)).limit(150);

        if (topPlayers.length > 0) {
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = [room.prizePool * 0.5, room.prizePool * 0.3, room.prizePool * 0.2][i];
            
            await db.transaction(async (tx) => {
              await tx.update(users).set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` }).where(eq(users.id, winner.id));
              await tx.insert(leaderboardWinners).values({ roomId: room.id, userId: winner.id, rank: i + 1, prizeAmount: prizeAmount.toString() });
              await tx.insert(transactions).values({ userId: winner.id, type: "room_rewards", amount: prizeAmount.toString(), currency: "USDT", status: "success", method: `Season Rank #${i + 1} [${room.id.toUpperCase()}]` });
            });
          }

          const topIds = topPlayers.map(p => p.telegramId).filter((id): id is string => id !== null);
          if (topIds.length > 0) {
            if (room.id === "bronze") await db.update(users).set({ qualifiedSilver: true }).where(inArray(users.telegramId, topIds));
            else if (room.id === "silver") await db.update(users).set({ qualifiedGold: true }).where(inArray(users.telegramId, topIds));
            else if (room.id === "gold") await db.update(users).set({ qualifiedDiamond: true }).where(inArray(users.telegramId, topIds));
          }
        }

        await db.update(users).set({ zpBronze: 0, zpSilver: 0, zpGold: 0, zpDiamond: 0 });
        const nextReset = new Date();
        nextReset.setUTCDate(nextReset.getUTCDate() + room.durationDays);
        await db.update(rooms).set({ resetAt: nextReset }).where(eq(rooms.id, room.id));
      }
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}