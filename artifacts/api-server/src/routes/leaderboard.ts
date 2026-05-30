import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const room = (req.query.room as string) || "bronze";

    const zpColumnMap: Record<string, any> = {
      bronze: users.zpBronze,
      silver: users.zpSilver,
      gold: users.zpGold,
      diamond: users.zpDiamond,
    };

    const targetZpCol = zpColumnMap[room] || users.zpBronze;

    const top = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        zp: targetZpCol,
      })
      .from(users)
      .where(sql`${targetZpCol} > 0`)
      .orderBy(desc(targetZpCol))
      .limit(100);

    const withRank = top.map((u, i) => ({ ...u, position: i + 1 }));
    return res.json(withRank);
  } catch (e) {
    console.error("Leaderboard API Error:", e);
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
