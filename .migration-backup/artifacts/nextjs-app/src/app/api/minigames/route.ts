
import { NextResponse } from 'next/server';

export async function GET() {
  try {

    const res = await fetch('https://gamepix.com', {
      next: { revalidate: 60 } 
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
