import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskCompletions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const MOCK_TELEGRAM_ID = "mock_001";

async function getMockUser() {
  const [user] = await db.select().from(users).where(eq(users.telegramId, MOCK_TELEGRAM_ID)).limit(1);
  return user;
}

export async function GET() {
  try {
    const user = await getMockUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db
      .select()
      .from(taskCompletions)
      .where(eq(taskCompletions.userId, user.id));

    const completionMap = Object.fromEntries(completions.map((c) => [c.taskId, c]));

    const result = allTasks.map((t) => ({
      ...t,
      completion: completionMap[t.id] ?? null,
    }));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, screenshotUrl } = body;
    const user = await getMockUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const existing = await db
      .select()
      .from(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const status = task.type === "screenshot" ? "pending" : "completed";

    const [completion] = await db
      .insert(taskCompletions)
      .values({ userId: user.id, taskId, status, screenshotUrl: screenshotUrl ?? null })
      .returning();

    if (status === "completed") {
      await db
        .update(users)
        .set({ coins: user.coins + task.rewardCoins })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ completion, rewardCoins: status === "completed" ? task.rewardCoins : 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
