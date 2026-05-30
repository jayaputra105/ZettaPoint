import { Router } from "express";
import { db } from "@workspace/db";
import { rooms, leaderboardWinners, users } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

async function processRoomReset(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return;

  const now = new Date();
  if (room.resetAt > now) return;

  const roomKeyMap: Record<string, any> = {
    bronze: users.zpBronze,
    silver: users.zpSilver,
    gold: users.zpGold,
    diamond: users.zpDiamond,
  };

  const zpCol = roomKeyMap[roomId];

  if (zpCol) {
    const winners = await db
      .select()
      .from(users)
      .orderBy(desc(zpCol))
      .limit(10);

    const prizeDistribution = [0.30, 0.20, 0.15, 0.10, 0.07, 0.05, 0.04, 0.03, 0.03, 0.03];

    for (let i = 0; i < winners.length && i < prizeDistribution.length; i++) {
      const prizeUSDT = Math.floor(room.prizePool * prizeDistribution[i]);
      if (prizeUSDT <= 0) continue;

      await db
        .update(users)
        .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeUSDT}` })
        .where(eq(users.id, winners[i].id));

      await db.insert(leaderboardWinners).values({
        roomId,
        userId: winners[i].id,
        rank: i + 1,
        prizeAmount: prizeUSDT.toString(),
      });
    }

    const zpResetSet: Record<string, any> = {
      zpBronze: 0,
      zpSilver: 0,
      zpGold: 0,
      zpDiamond: 0,
    };

    const zpKey = `zp${roomId.charAt(0).toUpperCase()}${roomId.slice(1)}`;
    const singleReset: Record<string, any> = {};
    singleReset[zpKey] = 0;

    await db.update(users).set(singleReset);
  }

  const nextReset = new Date(room.resetAt);
  nextReset.setDate(nextReset.getDate() + room.durationDays);

  await db
    .update(rooms)
    .set({ resetAt: nextReset })
    .where(eq(rooms.id, roomId));
}

router.get("/", async (req, res) => {
  try {
    const roomId = req.query.id as string;

    if (roomId) {
      await processRoomReset(roomId);

      const [roomData] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (roomData) {
        const now = new Date();
        const remainingMs = Math.max(0, roomData.resetAt.getTime() - now.getTime());
        return res.json({
          remainingMs,
          prizePool: roomData.prizePool,
        });
      }
      return res.json({ remainingMs: 0, prizePool: 0 });
    }

    const allRooms = await db.select().from(rooms);
    return res.json(allRooms);
  } catch (e) {
    console.error("Rooms API Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
