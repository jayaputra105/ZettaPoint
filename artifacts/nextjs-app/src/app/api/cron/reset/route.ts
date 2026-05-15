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
      // Cek apakah room ini sudah jatuh tempo reset
      if (now >= new Date(room.resetAt)) {
        
        // Pilih kolom ZP yang sesuai dengan room id
        const zpColumnMap: Record<string, any> = {
          bronze: users.zpBronze,
          silver: users.zpSilver,
          gold: users.zpGold,
          diamond: users.zpDiamond
        };
        const activeZpCol = zpColumnMap[room.id];

        // 1. Ambil Top 150 di room ini saja
        const topPlayers = await db
          .select()
          .from(users)
          .where(sql`${activeZpCol} > 0`)
          .orderBy(desc(activeZpCol))
          .limit(150);

        if (topPlayers.length > 0) {
          // 2. Bagi Payout USDT buat Top 3
          const prizes = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = room.prizePool * prizes[i];

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

          // 3. Update Kualifikasi ke Room Selanjutnya
          const nextRoomMap: Record<string, any> = {
            bronze: "qualifiedSilver",
            silver: "qualifiedGold",
            gold: "qualifiedDiamond"
          };
          const nextCol = nextRoomMap[room.id];
          if (nextCol) {
            const topIds = topPlayers.map(p => p.telegramId);
            await db.update(users)
              .set({ [nextCol]: true })
              .where(sql`telegram_id IN ${topIds}`);
          }
        }

        // 4. RESET ZP HANYA UNTUK ROOM INI
        await db.update(users).set({ [activeZpCol.name]: 0 });

        // 5. Update Waktu Reset Berikutnya
        const nextReset = new Date();
        nextReset.setUTCDate(nextReset.getUTCDate() + room.durationDays);
        nextReset.setUTCHours(0, 0, 0, 0);

        await db.update(rooms)
          .set({ resetAt: nextReset })
          .where(eq(rooms.id, room.id));

        console.log(`[CRON] Room ${room.id} reset success.`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}