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
    
    // Kondisi 2: Cari data room spesifik
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // =========================================================
    // 🕒 FIX MUTLAK: AMBIL MILIDETIK LANGSUNG DARI OBJEK DATE DB
    // =========================================================
    const nowTime = Date.now();
    
    // Drizzle secara default mengembalikan objek Date murni, langsung konversi ke angka milidetik
    const targetTime = room.resetAt instanceof Date 
      ? room.resetAt.getTime() 
      : new Date(room.resetAt).getTime();
    
    // Cari selisih angka milidetik bersih (jika waktu lewat, minimal return 0)
    const remainingMs = Math.max(0, targetTime - nowTime);
    
    // Kirimkan data matang ke frontend
    return NextResponse.json({
      id: room.id,
      prizePool: room.prizePool,
      resetAt: room.resetAt,
      remainingMs: remainingMs // Angka bulat bersih anti-error zona waktu
    });
  } catch (e) {
    console.error("Rooms API Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}