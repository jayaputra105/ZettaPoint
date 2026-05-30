import { Router } from "express";
import { db } from "@workspace/db";
import { rooms } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const roomId = req.query.id as string;

    if (roomId) {
      const roomData = await db.select().from(rooms).where(eq(rooms.id, roomId));
      if (roomData.length > 0) {
        const now = new Date();
        const resetTime = new Date(roomData[0].resetAt);
        const remainingMs = Math.max(0, resetTime.getTime() - now.getTime());
        return res.json({
          remainingMs,
          prizePool: roomData[0].prizePool,
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
