import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("id");
    
    if (!roomId) {
      const allRooms = await db.select().from(rooms);
      return NextResponse.json(allRooms);
    }
    
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    const now = new Date();
    const nowTime = now.getTime();
    const targetReset = new Date(room.resetAt).getTime();
    
    let remainingMs = targetReset - nowTime;
    
    // 🛡️ PERISAI EMERGENSI: Jika sisa waktu <= 0 karena delay server cron,
    // paksa hitung sisa jam menuju tengah malam UTC terdekat biar UI gak macet nulis "Resetting..."
    if (remainingMs <= 0) {
      const nextMidnightUTC = new Date();
      nextMidnightUTC.setUTCHours(24, 0, 0, 0);
      remainingMs = nextMidnightUTC.getTime() - nowTime;
    }
    
    return NextResponse.json({
      id: room.id,
      prizePool: room.prizePool,
      resetAt: room.resetAt,
      remainingMs: Math.max(0, remainingMs)
    });
  } catch (e) {
    console.error("Rooms API Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}