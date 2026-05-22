import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners, transactions } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      const roomTargetReset = new Date(room.resetAt);

      if (now >= roomTargetReset) {
        // Pemetaan kolom ZP
        const zpColumnMap: Record<string, any> = {
          bronze: users.zpBronze,
          silver: users.zpSilver,
          gold: users.zpGold,
          diamond: users.zpDiamond
        };
        const activeZpCol = zpColumnMap[room.id];

        if (!activeZpCol) continue;

        const topPlayers = await db
          .select()
          .from(users)
          .where(sql`${activeZpCol} > 0`)
          .orderBy(desc(activeZpCol))
          .limit(150);

        if (topPlayers.length > 0) {
          const prizesRatio = [0.50, 0.30, 0.20];
          
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = room.prizePool * prizesRatio[i];

            if (winner.telegramId && prizeAmount > 0) {
              await db.transaction(async (tx) => {
                await tx.update(users)
                  .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` })
                  .where(eq(users.id, winner.id));

                await tx.insert(leaderboardWinners).values({
                  roomId: room.id,
                  userId: winner.id,
                  rank: i + 1,
                  prizeAmount: prizeAmount.toString(),
                });

                await tx.insert(transactions).values({
                  userId: winner.id,
                  type: "room_rewards",
                  amount: prizeAmount.toString(),
                  currency: "USDT",
                  status: "success",
                  method: `Season Rank #${i + 1} Reward [Room ${room.id.toUpperCase()}]`,
                });
              });
            }
          }

          // PROMOSI USER (Update manual agar tidak error)
          const topIds = topPlayers
            .map(p => p.telegramId)
            .filter((id): id is string => id !== null);

          if (topIds.length > 0) {
            if (room.id === "bronze") {
              await db.update(users).set({ qualifiedSilver: true }).where(inArray(users.telegramId, topIds));
            } else if (room.id === "silver") {
              await db.update(users).set({ qualifiedGold: true }).where(inArray(users.telegramId, topIds));
            } else if (room.id === "gold") {
              await db.update(users).set({ qualifiedDiamond: true }).where(inArray(users.telegramId, topIds));
            }
          }
        }

        // RESET POIN (Menggunakan string nama kolom secara eksplisit)
        const zpResetMap: Record<string, any> = {
          bronze: { zpBronze: 0 },
          silver: { zpSilver: 0 },
          gold: { zpGold: 0 },
          diamond: { zpDiamond: 0 }
        };
        await db.update(users).set(zpResetMap[room.id]);

        // UPDATE WAKTU RESET
        let durationDays = (room.id === "bronze") ? 1 : (room.id === "silver" ? 3 : 7);
        const nextReset = new Date();
        nextReset.setUTCHours(0, 0, 0, 0); 
        nextReset.setUTCDate(nextReset.getUTCDate() + durationDays);

        await db.update(rooms)
          .set({ resetAt: nextReset, durationDays: durationDays })
          .where(eq(rooms.id, room.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reset Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}