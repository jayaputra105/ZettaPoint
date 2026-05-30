import { Router } from "express";
import { db } from "@workspace/db";
import { tasks, taskCompletions, users, spinRecords } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router = Router();

function isToday(date: Date | string | null): boolean {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

async function validateTaskClaim(taskKey: string | null, userId: number): Promise<{ valid: boolean; message?: string }> {
  if (!taskKey) return { valid: true };

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { valid: false, message: "User not found" };

  switch (taskKey) {
    case "daily_login":
      return { valid: true };

    case "bonus_join":
      return { valid: true };

    case "spin_3x": {
      const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, userId)).limit(1);
      if (!spin || !spin.lastFreeSpinAt) return { valid: false, message: "Spin the wheel 3 times first" };
      const spunToday = isToday(spin.lastFreeSpinAt);
      const adsToday = spin.adsSpinsToday ?? 0;
      const totalSpinsToday = (spunToday ? 1 : 0) + adsToday;
      if (totalSpinsToday < 3) return { valid: false, message: `Only ${totalSpinsToday}/3 spins done today` };
      return { valid: true };
    }

    case "watch_ad":
      if (user.dailyAdsWatched < 1) return { valid: false, message: "Watch at least 1 ad first" };
      return { valid: true };

    case "play_minigames":
      if (user.dailyGameMinutes < 5) return { valid: false, message: "Play for at least 5 minutes first" };
      return { valid: true };

    case "connect_ton_wallet":
      if (!user.tonWalletAddress) return { valid: false, message: "Connect your TON wallet first in Wallet page" };
      return { valid: true };

    case "invite_friends": {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.referrerId, userId));
      const count = Number(row?.count ?? 0);
      if (count < 1) return { valid: false, message: "Invite at least 1 friend first" };
      return { valid: true };
    }

    case "seven_day_streak":
      if (user.streakDays < 7) return { valid: false, message: `Only ${user.streakDays}/7 day streak` };
      return { valid: true };

    case "follow_twitter":
    case "join_tg_channel":
    case "share_story":
      return { valid: true };

    default:
      return { valid: true };
  }
}

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
          isDone = comp.status === "completed";
        } else {
          isDone = isToday(comp.claimedAt) && comp.status === "completed";
        }
      }
      return { ...t, completion: isDone ? comp : comp?.status === "pending" ? comp : null };
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

    const existingCompletion = await db
      .select()
      .from(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
      .limit(1);

    if (existingCompletion.length > 0) {
      const comp = existingCompletion[0];
      if (task.category === "one_time" && comp.status === "completed") {
        return res.status(400).json({ error: "Task already completed" });
      }
      if (task.category === "daily" && isToday(comp.claimedAt) && comp.status === "completed") {
        return res.status(400).json({ error: "Already claimed today" });
      }
    }

    const isScreenshot = task.type === "screenshot";

    if (!isScreenshot) {
      const { valid, message } = await validateTaskClaim(task.taskKey, user.id);
      if (!valid) return res.status(400).json({ error: message || "Task requirements not met" });
    }

    const status = isScreenshot ? "pending" : "completed";
    let completionData: any = null;

    await db.transaction(async (tx) => {
      if (existingCompletion.length > 0) {
        const [updated] = await tx
          .update(taskCompletions)
          .set({ status, screenshotUrl: screenshotUrl ?? null, claimedAt: new Date() })
          .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
          .returning();
        completionData = updated;
      } else {
        const [inserted] = await tx
          .insert(taskCompletions)
          .values({ userId: user.id, taskId, status, screenshotUrl: screenshotUrl ?? null })
          .returning();
        completionData = inserted;
      }

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
