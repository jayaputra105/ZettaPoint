import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  // PROTECTION LAYER: Integrasi Vercel Automation Cron Security Check
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      const roomTargetReset = new Date(room.resetAt);

      // KUNCI COOLDOWN: Eksekusi jalan hanya jika jam server sudah menyentuh atau melewati target UTC 00:00
      if (now >= roomTargetReset) {
        
        // Pemetaan String Nama Kolom murni Drizzle ORM (Pencegah Bug .name undefined)
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

        // Fetch barisan player yang berhak mendapatkan pembagian hasil
        const topPlayers = await db
          .select()
          .from(users)
          .where(sql`${activeZpCol} > 0`)
          .orderBy(desc(activeZpCol))
          .limit(150);

        if (topPlayers.length > 0) {
          // HARGA MATI SESUAI ATURAN LU: 50% | 30% | 20%
          const prizesRatio = [0.50, 0.30, 0.20];
          
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = room.prizePool * prizesRatio[i];

            if (winner.telegramId && prizeAmount > 0) {
              await db.transaction(async (tx) => {
                // 1. Suntik USDT murni ke saldo pemenang
                await tx.update(users)
                  .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` })
                  .where(eq(users.id, winner.id));

                // 2. Kunci riwayat pemenang musiman
                await tx.insert(leaderboardWinners).values({
                  roomId: room.id,
                  userId: winner.id,
                  rank: i + 1,
                  prizeAmount: prizeAmount.toString(),
                });

                // 3. Masukkan ke log arus mutasi keuangan
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

          // KUALIFIKASI PROMOSI KAMAR TOP 150 BESAR
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

        // BERSIHKAN POIN KAMAR TERKAIT (RESET TO ZERO)
        await db.update(users).set({ [activeZpString]: 0 });

        // TARGET WAKTU RESCHEDULE JATUH TEMPO BERIKUTNYA PAS JAM 00:00 UTC SINKRON DURATION
        const nextReset = new Date();
        nextReset.setUTCDate(nextReset.getUTCDate() + room.durationDays);
        nextReset.setUTCHours(0, 0, 0, 0); // Kunci Paksa Detik Menit Jam Ke Nol UTC!

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