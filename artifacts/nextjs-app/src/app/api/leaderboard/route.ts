import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const top = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        coins: users.coins,
        rank: users.rank,
      })
      .from(users)
      .orderBy(desc(users.coins))
      .limit(100);

    const withRank = top.map((u, i) => ({ ...u, position: i + 1 }));
    return NextResponse.json(withRank);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
