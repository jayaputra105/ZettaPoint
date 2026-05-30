import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskCompletions, users, spinRecords } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    
    if (!telegramId) return NextResponse.json({ error: "No Telegram ID provided" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db.select().from(taskCompletions).where(eq(taskCompletions.userId, user.id));
    
    const completionMap = Object.fromEntries(completions.map((c) => [c.taskId, c]));
    
    const result = allTasks.map((t) => {
      const comp = completionMap[t.id];
      let isDone = false;
      if (comp) {
        // Logika Reset Daily
        if (t.category === 'one_time') {
          isDone = true;
        } else {
          const lastDone = new Date(comp.claimedAt);
          isDone = lastDone.toDateString() === new Date().toDateString();
        }
      }
      return { ...t, completion: isDone ? comp : null };
    });
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, screenshotUrl, telegramId } = body;
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    
    if (!user || !task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const status = task.type === "screenshot" ? "pending" : "completed";
    let completionData: any = null;
    
    await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(taskCompletions).values({
        userId: user.id, taskId, status, screenshotUrl: screenshotUrl ?? null
      }).returning();
      completionData = inserted;
      if (status === "completed") {
        await tx.update(users).set({ coins: sql`${users.coins} + ${task.rewardCoins}` }).where(eq(users.id, user.id));
      }
    });
    
    return NextResponse.json({ completion: completionData, rewardCoins: status === "completed" ? task.rewardCoins : 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}