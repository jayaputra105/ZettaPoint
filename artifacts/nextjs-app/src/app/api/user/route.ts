import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { telegramId, name, username } = await req.json();

    // Cari user berdasarkan ID asli, bukan mock
    let [user] = await db.select().from(users).where(eq(users.telegramId, telegramId.toString())).limit(1);
    
    if (!user) {
      // Kalo ga ada, daftarin baru
      const inserted = await db.insert(users).values({
        telegramId: telegramId.toString(),
        name: name || "Zetta Player",
        username: username || "",
        coins: 0,
        rank: 0,
      }).returning();
      user = inserted[0];
    }
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
const { telegramId, addCoins } = await req.json();

const updated = await db
  .update(users)
  .set({ 
    // Operasi matematika langsung di database
    coins: sql`${users.coins} + ${addCoins ?? 0}` 
  })
  .where(eq(users.telegramId, telegramId.toString()))
  .returning();

return NextResponse.json(updated[0]);

    const updated = await db
      .update(users)
      .set({ coins: user.coins + (body.addCoins ?? 0) })
      .where(eq(users.telegramId, MOCK_TELEGRAM_ID))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
