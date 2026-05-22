
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Server Next.js Anda menembak langsung ke GamePix (Aman & Bebas CORS)
    const res = await fetch('https://feeds.gamepix.com/v2/json?sid=OO6AO&pagination=12&page=1', {
      next: { revalidate: 60 } // Simpan cache 60 detik agar web Anda super cepat
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Gagal mengambil data dari GamePix' }, { status: 500 });
    }

    const result = await res.json();
    return NextResponse.json(result.data || []);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
