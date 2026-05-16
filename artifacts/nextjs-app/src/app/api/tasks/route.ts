import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskCompletions, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegramId");
    
    if (!telegramId) return NextResponse.json({ error: "No Telegram ID provided" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const allTasks = await db.select().from(tasks).where(eq(tasks.active, true));
    const completions = await db
      .select()
      .from(taskCompletions)
      .where(eq(taskCompletions.userId, user.id));
    
    const completionMap = Object.fromEntries(completions.map((c) => [c.taskId, c]));
    
    // Output berbentuk { ...task, completion: { status: 'completed' } } sesuai frontend asli lu
    const result = allTasks.map((t) => ({
      ...t,
      completion: completionMap[t.id] ?? null,
    }));
    
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET Tasks Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, screenshotUrl, telegramId } = body;
    
    if (!telegramId || !taskId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    
    const existing = await db
      .select()
      .from(taskCompletions)
      .where(and(eq(taskCompletions.userId, user.id), eq(taskCompletions.taskId, taskId)))
      .limit(1);
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "Mission already submitted" }, { status: 400 });
    }
    
    const status = task.type === "screenshot" ? "pending" : "completed";
    let completionData: any = null;
    
    // Memakai database transaction biar operasi write aman sentosa
    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(taskCompletions)
        .values({
          userId: user.id,
          taskId,
          status,
          screenshotUrl: screenshotUrl ?? null
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
    
    return NextResponse.json({
      completion: completionData,
      rewardCoins: status === "completed" ? task.rewardCoins : 0
    });
  } catch (e) {
    console.error("POST Tasks Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}