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
      return NextResponse.json({ error: "Mission already completed" }, { status: 400 });
    }
    
    // =========================================================================
    // VALIDATION GUARD UNTUK TYPE "SYSTEM" (In-Game Goals)
    // =========================================================================
    if (task.type === "system") {
      let isValid = false;
      let errorMsg = "Requirements not met yet!";
      
      switch (task.taskKey) {
        case "ton_wallet_connect":
          isValid = !!user.tonWalletAddress;
          errorMsg = "Please connect your TON wallet first!";
          break;
          
        case "lucky_spin_3x":
          const [spin] = await db.select().from(spinRecords).where(eq(spinRecords.userId, user.id)).limit(1);
          isValid = spin ? spin.adsSpinsToday >= 3 : false;
          errorMsg = "You haven't spun the lucky wheel 3 times today!";
          break;
          
        case "play_mini_games":
          isValid = user.dailyGameMinutes >= 5;
          errorMsg = "You need to play mini-games for at least 5 minutes today!";
          break;
          
        case "watch_ad_daily":
          isValid = user.dailyAdsWatched >= 1;
          errorMsg = "You haven't watched any ad today!";
          break;
          
        case "daily_login":
          isValid = true;
          break;
          
        case "bonus_join_game":
          isValid = true;
          break;
          
        case "seven_day_streak":
          isValid = user.streakDays >= 7;
          errorMsg = "You haven't reached a 7-day login streak yet!";
          break;
          
        case "invite_friend":
          const [inviteCount] = await db
            .select({ count: sql < number > `count(*)` })
            .from(users)
            .where(eq(users.referrerId, user.id));
          isValid = inviteCount ? inviteCount.count >= 1 : false;
          errorMsg = "You haven't invited any friends yet!";
          break;
          
        default:
          isValid = false;
          errorMsg = "Unknown system task criteria.";
      }
      
      if (!isValid) {
        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }
    }
    // =========================================================================
    
    const status = task.type === "screenshot" ? "pending" : "completed";
    let completionData: any = null;
    
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