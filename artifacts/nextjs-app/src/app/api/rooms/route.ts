import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("id"); // e.g., 'bronze', 'silver', dll.
    
    // Kondisi 1: Jika tidak ada ID, kirim seluruh data room list polosan
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
    // 🛸 SATU IMAN ENGINE: HITUNG SISA WAKTU ASLI DARI DATABASE
    // =========================================================
    const now = new Date().getTime();
    const targetReset = new Date(room.resetAt).getTime();
    
    // Sisa waktu murni hasil pengurangan target masa depan di DB dikurangi waktu sekarang
    // Menggunakan Math.max agar jika server telat nge-cron, angka di frontend tidak minus
    const remainingMs = Math.max(0, targetReset - now);
    
    // Kirimkan data matang ke frontend tanpa rumus abu-abu harian lagi!
    return NextResponse.json({
      id: room.id,
      prizePool: room.prizePool,
      resetAt: room.resetAt,
      remainingMs: remainingMs // FIX: Akurat merayap mundur mengikuti DB!
    });
  } catch (e) {
    console.error("Rooms API Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}