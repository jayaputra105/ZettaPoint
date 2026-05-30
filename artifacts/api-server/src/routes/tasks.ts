import { Router } from "express";
import { db } from "@workspace/db";
import { tasks, taskCompletions, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const telegramId = req.query.telegramId as string;
    if (!telegramId) return res.status(400).json({ error: "No Telegram ID provided" });

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db.select().from(taskCompletions).where(eq(taskCompletions.userId, user.id));

    const completionMap = Object.fromEntries(completions.map((c) => [c.taskId, c]));

    const result = allTasks.map((t) => {
      const comp = completionMap[t.id];
      let isDone = false;
      if (comp) {
        if (t.category === "one_time") {
          isDone = true;
        } else {
          const lastDone = new Date(comp.claimedAt);
          isDone = lastDone.toDateString() === new Date().toDateString();
        }
      }
      return { ...t, completion: isDone ? comp : null };
    });

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

router.post("/", async (req, res) => {
  try {
    const { taskId, screenshotUrl, telegramId } = req.body;

    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

    if (!user || !task) return res.status(404).json({ error: "Not found" });

    const status = task.type === "screenshot" ? "pending" : "completed";
    let completionData: any = null;

    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(taskCompletions)
        .values({
          userId: user.id,
          taskId,
          status,
          screenshotUrl: screenshotUrl ?? null,
        })
        .returning();
      completionData = inserted;
      if (status === "completed") {
        await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${task.rewardCoins}` })
          .where(eq(users.id, user.id));
      }
    });

    return res.json({
      completion: completionData,
      rewardCoins: status === "completed" ? task.rewardCoins : 0,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

export default router;
