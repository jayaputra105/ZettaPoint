import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  // Ambil koneksi ke Neon pake URL yang lu punya
  const sql = neon(process.env.DATABASE_URL!);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const gameUrl = `https://${process.env.VERCEL_URL}`; // URL game lu otomatis

  try {
    const body = await req.json();
    const message = body.message;

    if (message && message.text === '/start') {
      const { id, first_name, username } = message.from;

      // 1. Masukin data ke database Neon (Gak gua ubah strukturnya sesuai mau lu)
      await sql`
        INSERT INTO users (telegram_id, name, username, coins, rank)
        VALUES (${id.toString()}, ${first_name}, ${username || ''}, 0, 0)
        ON CONFLICT (telegram_id) DO NOTHING
      `;

      // 2. Kirim pesan ke Telegram dengan tombol "Play Now"
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: `Woi ${first_name}! Playzetta udah siap. Klik tombol di bawah buat langsung main dan cari cuan!`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Play Now",
                  web_app: { url: 'https://zetta-point-api-server.vercel.app/?v=1' }
                }
              ]
            ]
          }
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error Webhook:', err);
    return NextResponse.json({ ok: false });
  }
}