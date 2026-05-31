import { Router } from "express";
import { db } from "@workspace/db";
import { rooms, leaderboardWinners, users } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

async function resetRoom(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return { skipped: true, reason: "not found" };

  const now = new Date();
  if (room.resetAt > now) return { skipped: true, reason: "not yet due" };

  const roomKeyMap: Record<string, any> = {
    bronze: users.zpBronze,
    silver: users.zpSilver,
    gold: users.zpGold,
    diamond: users.zpDiamond,
  };

  const zpCol = roomKeyMap[roomId];
  let winnersCount = 0;

  if (zpCol) {
    const winners = await db.select().from(users).orderBy(desc(zpCol)).limit(10);
    const prizeDistribution = [0.30, 0.20, 0.15, 0.10, 0.07, 0.05, 0.04, 0.03, 0.03, 0.03];

    for (let i = 0; i < winners.length && i < prizeDistribution.length; i++) {
      const prizeUSDT = Math.floor(room.prizePool * prizeDistribution[i]);
      if (prizeUSDT <= 0) continue;
      await db.update(users)
        .set({ usdtBalance: sql`${users.usdtBalance} + ${prizeUSDT}` })
        .where(eq(users.id, winners[i].id));
      await db.insert(leaderboardWinners).values({
        roomId,
        userId: winners[i].id,
        rank: i + 1,
        prizeAmount: prizeUSDT.toString(),
      });
      winnersCount++;
    }

    const zpKey = `zp${roomId.charAt(0).toUpperCase()}${roomId.slice(1)}`;
    await db.update(users).set({ [zpKey]: 0 });
  }

  const nextReset = new Date(room.resetAt);
  nextReset.setDate(nextReset.getDate() + room.durationDays);
  await db.update(rooms).set({ resetAt: nextReset }).where(eq(rooms.id, roomId));

  return { skipped: false, winnersCount };
}

router.get("/reset-rooms", async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const roomIds = ["bronze", "silver", "gold", "diamond"];
    const results: Record<string, any> = {};

    for (const roomId of roomIds) {
      results[roomId] = await resetRoom(roomId);
    }

    return res.json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (e) {
    console.error("Cron reset-rooms error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
