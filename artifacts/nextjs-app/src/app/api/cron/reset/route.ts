import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  // PENGAMAN CRON
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      if (now >= new Date(room.resetAt)) {
        
        // Mapping kolom ZP
        const zpColumnMap: Record<string, any> = {
          bronze: users.zpBronze,
          silver: users.zpSilver,
          gold: users.zpGold,
          diamond: users.zpDiamond
        };
        const activeZpCol = zpColumnMap[room.id];

        const topPlayers = await db
          .select()
          .from(users)
          .where(sql`${activeZpCol} > 0`)
          .orderBy(desc(activeZpCol))
          .limit(150);

        if (topPlayers.length > 0) {
          const prizes = [0.5, 0.3, 0.2];
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = room.prizePool * prizes[i];

            // FIX TYPE ERROR: Pastikan telegramId tidak null sebelum update
            if (winner.telegramId) {
              await db.update(users)
                .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` })
                .where(eq(users.telegramId, winner.telegramId));

              await db.insert(leaderboardWinners).values({
                roomId: room.id,
                userId: winner.id,
                rank: i + 1,
                prizeAmount: prizeAmount.toString(),
              });
            }
          }

          const nextRoomMap: Record<string, any> = {
            bronze: "qualifiedSilver",
            silver: "qualifiedGold",
            gold: "qualifiedDiamond"
          };
          const nextCol = nextRoomMap[room.id];
          if (nextCol) {
            // Filter hanya ID yang valid (bukan null)
            const topIds = topPlayers
              .map(p => p.telegramId)
              .filter((id): id is string => id !== null);

            if (topIds.length > 0) {
              await db.update(users)
                .set({ [nextCol]: true })
                .where(sql`telegram_id IN ${topIds}`);
            }
          }
        }

        // Reset ZP room terkait
        await db.update(users).set({ [activeZpCol.name]: 0 });

        // Set reset baru
        const nextReset = new Date();
        nextReset.setUTCDate(nextReset.getUTCDate() + room.durationDays);
        nextReset.setUTCHours(0, 0, 0, 0);

        await db.update(rooms)
          .set({ resetAt: nextReset })
          .where(eq(rooms.id, room.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reset Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}