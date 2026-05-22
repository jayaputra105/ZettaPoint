import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  // PROTECTION LAYER: Validasi Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      const roomTargetReset = new Date(room.resetAt);

      // Eksekusi berjalan jika waktu sekarang sudah melewati batas reset database
      if (now >= roomTargetReset) {
        
        const zpStringMap: Record<string, string> = {
          bronze: "zp_bronze",
          silver: "zp_silver",
          gold: "zp_gold",
          diamond: "zp_diamond"
        };
        const activeZpString = zpStringMap[room.id];

        const zpColumnMap: Record<string, any> = {
          bronze: users.zpBronze,
          silver: users.zpSilver,
          gold: users.zpGold,
          diamond: users.zpDiamond
        };
        const activeZpCol = zpColumnMap[room.id];

        // Fetch top kontender musim ini
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
                // 1. Tambah saldo USDT global
                await tx.update(users)
                  .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` })
                  .where(eq(users.id, winner.id));

                // 2. Catat sejarah podium juara
                await tx.insert(leaderboardWinners).values({
                  roomId: room.id,
                  userId: winner.id,
                  rank: i + 1,
                  prizeAmount: prizeAmount.toString(),
                });

                // 3. Catat riwayat mutasi transaksi wallet
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

          // ATURAN SAKTI LU: Promosi otomatis Top 150 (TIDAK BERUBAH)
          const nextRoomMap: Record<string, string> = {
            bronze: "qualified_silver",
            silver: "qualified_gold",
            gold: "qualified_diamond"
          };
          const nextColString = nextRoomMap[room.id];
          
          if (nextColString) {
            const topIds = topPlayers
              .map(p => p.telegramId)
              .filter((id): id is string => id !== null);

            if (topIds.length > 0) {
              await db.update(users)
                .set({ [nextColString]: true })
                .where(sql`telegram_id IN ${topIds}`);
            }
          }
        }

        // KUNCI MATI: Bersihkan poin kamar terkait kembali ke nol
        await db.update(users).set({ [activeZpString]: 0 });

        // PENENTUAN DURASI DURAKA KAKU SESUAI SPEK LU
        let durationDays = 1; // Bronze 1 hari
        if (room.id === "silver") {
          durationDays = 3;   // Silver 3 hari
        } else if (room.id === "gold" || room.id === "diamond") {
          durationDays = 7;   // Gold & Diamond 7 hari
        }

    
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
