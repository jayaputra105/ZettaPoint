import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, rooms, leaderboardWinners, transactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  // PROTECTION LAYER: Autentikasi sistem cron otomatis Vercel
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const allRooms = await db.select().from(rooms);
    const now = new Date();

    for (const room of allRooms) {
      const roomTargetReset = new Date(room.resetAt);

      // Eksekusi jalan hanya jika jam server sudah menyentuh atau melewati target UTC 00:00
      if (now >= roomTargetReset) {
        
        // Pemetaan String Nama Kolom murni Drizzle ORM
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

        // Fetch top pemain teratas di season ini
        const topPlayers = await db
          .select()
          .from(users)
          .where(sql`${activeZpCol} > 0`)
          .orderBy(desc(activeZpCol))
          .limit(150);

        if (topPlayers.length > 0) {
          // HARGA MATI: 50% | 30% | 20%
          const prizesRatio = [0.50, 0.30, 0.20];
          
          for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
            const winner = topPlayers[i];
            const prizeAmount = room.prizePool * prizesRatio[i];

            if (winner.telegramId && prizeAmount > 0) {
              await db.transaction(async (tx) => {
                // 1. Suntik USDT langsung ke dompet global pemenang
                await tx.update(users)
                  .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeAmount}` })
                  .where(eq(users.id, winner.id));

                // 2. Catat sejarah juara di tabel pemenang season
                await tx.insert(leaderboardWinners).values({
                  roomId: room.id,
                  userId: winner.id,
                  rank: i + 1,
                  prizeAmount: prizeAmount.toString(),
                });

                // 3. Catat jalur transaksi mutasi wallet biar user tidak bingung
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

          // PROMOSI KAMAR OTOMATIS BAGI TOP 150 BESAR
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

        // =========================================================
        // 🛠️ FIX MATI ATURAN LU: KUNCI DURASI SINKRON SESUAI ROOM ID
        // =========================================================
        let durationDays = 1; // Default Bronze 1 hari
        if (room.id === "silver") {
          durationDays = 3;   // Silver 3 hari
        } else if (room.id === "gold" || room.id === "diamond") {
          durationDays = 7;   // Gold & Diamond 7 hari
        }

        // Target waktu reschedule jatuh tempo berikutnya pas jam 00:00 UTC
        const nextReset = new Date();
        nextReset.setUTCDate(nextReset.getUTCDate() + durationDays);
        nextReset.setUTCHours(0, 0, 0, 0); // Kunci Paksa Jam Ke Nol UTC!

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