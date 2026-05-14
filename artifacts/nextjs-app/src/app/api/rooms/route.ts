import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("id"); // e.g., 'bronze', 'silver', dll.
    
    if (!roomId) {
      const allRooms = await db.select().from(rooms);
      return NextResponse.json(allRooms);
    }
    
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    return NextResponse.json(room);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}