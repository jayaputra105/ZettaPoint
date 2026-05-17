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
    // 🛸 BYPASS TIMEZONE ENGINE: HITUNG SISA WAKTU MURNI JAVASCRIPT
    // =========================================================
    const now = new Date();
    
    // Ambil timestamp detik saat ini dalam UTC
    const nowTime = now.getTime();
    
    // Paksa buat target jam 00:00 UTC terdekat (Malam ini jam 12 malam waktu UTC)
    const nextMidnightUTC = new Date();
    nextMidnightUTC.setUTCHours(24, 0, 0, 0);
    const msToMidnight = nextMidnightUTC.getTime() - nowTime;
    
    // Ambil durasi hari asli berdasarkan aturan sakti dari lu
    let durationDays = Number(room.durationDays) || 1;
    if (room.id === "bronze") durationDays = 1;
    if (room.id === "silver") durationDays = 3;
    if (room.id === "gold" || room.id === "diamond") durationDays = 7;
    
    // Sisa hari real = (durasi hari - 1) dikali milidetik satu hari penuh
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // KUNCI AMAN: Sisa waktu adalah sisa jam menuju tengah malam UTC malam ini + sisa hari berikutnya
    const remainingMs = msToMidnight + ((durationDays - 1) * oneDayMs);
    
    // Kirimkan data matang ke frontend tanpa bergantung format tanggal DB lagi
    return NextResponse.json({
      id: room.id,
      prizePool: room.prizePool,
      resetAt: room.resetAt,
      remainingMs: remainingMs // Angka bulat bersih, anti-selisih jam antar device!
    });
  } catch (e) {
    console.error("Rooms API Error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}