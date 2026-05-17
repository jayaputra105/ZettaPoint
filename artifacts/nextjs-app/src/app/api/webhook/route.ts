import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  const sql = neon(process.env.DATABASE_URL!);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const body = await req.json();

    // ─── [KONDISI 1] HANDLE CALLBACK QUERY (WD ADMIN) ───
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const adminChatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;

      if (callbackData.startsWith("confirm_wd_") || callbackData.startsWith("reject_wd_")) {
        const isConfirm = callbackData.startsWith("confirm_wd_");
        const txId = callbackData.replace(isConfirm ? "confirm_wd_" : "reject_wd_", "");
        const statusBaru = isConfirm ? "success" : "failed";

        await sql`UPDATE transactions SET status = ${statusBaru} WHERE id = ${parseInt(txId)}`;
        const [tx] = await sql`SELECT user_id, amount, method FROM transactions WHERE id = ${parseInt(txId)}`;
        
        let teksBalasanAdmin = isConfirm ? `✅ WD ID #${txId} Sukses!` : `❌ WD ID #${txId} Ditolak!`;

        await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            message_id: messageId,
            text: `${callbackQuery.message.text}\n\n=====================\nSTATUS KINI: ${teksBalasanAdmin}`
          })
        });

        if (tx) {
          const [user] = await sql`SELECT telegram_id FROM users WHERE id = ${tx.user_id}`;
          if (user && user.telegram_id) {
            const teksUser = isConfirm 
              ? `🎉 WD dana lu sebesar $${tx.amount} USDT udah dicairkan admin!`
              : `⚠️ WD dana lu sebesar $${tx.amount} USDT DITOLAK oleh admin.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: user.telegram_id, text: teksUser })
            });
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ─── [KONDISI 2] HANDLE USER MASUK LEWAT LINK REFERRAL ───
    const message = body.message;
    if (message && message.text) {
      const textRaw = message.text;
      const { id, first_name, username } = message.from;

      if (textRaw.startsWith('/start')) {
        let inviterDbId: number | null = null;
        let inviterTgId: string | null = null;
        
        // 1. Potong teks buat nyari ID Telegram si pengundang (e.g., /start 11223344)
        const match = textRaw.match(/^\/start\s+(\d+)/);
        if (match && match[1]) {
          const detectedTgId = match[1];
          if (detectedTgId !== id.toString()) {
            inviterTgId = detectedTgId;
            
            // 2. Cari ID internal database (integer) milik si pengundang berdasarkan telegram_id-nya
            const [inviterUser] = await sql`SELECT id FROM users WHERE telegram_id = ${detectedTgId}`;
            if (inviterUser) {
              inviterDbId = inviterUser.id; // Kunci angka integer-nya (e.g., 12)
            }
          }
        }

        // Cek apakah user baru ini udah terdaftar sebelumnya di DB
        const [existingUser] = await sql`SELECT id, referrer_id FROM users WHERE telegram_id = ${id.toString()}`;
        let finalInviterParam = "";

        if (!existingUser) {
          // JIKA USER BARU: Masukkan data dan pasang referrer_id sesuai tipe integer schema lu!
          await sql`
            INSERT INTO users (telegram_id, name, username, coins, rank, referrer_id)
            VALUES (${id.toString()}, ${first_name}, ${username || ''}, 0, 0, ${inviterDbId})
            ON CONFLICT (telegram_id) DO NOTHING
          `;

          // Jika pengundangnya valid, kirim parameter ID Telegram-nya buat frontend (opsional)
          if (inviterTgId) {
            finalInviterParam = `&inviter=${inviterTgId}`;
          }
        } else {
          // JIKA USER LAMA: Cek apakah dia punya referrer, kalau ada relasikan ID-nya ke frontend jika butuh
          if (existingUser.referrer_id) {
            const [currentInviter] = await sql`SELECT telegram_id FROM users WHERE id = ${existingUser.referrer_id}`;
            if (currentInviter) {
              finalInviterParam = `&inviter=${currentInviter.telegram_id}`;
            }
          }
        }

        // URL WebApp yang nempel di tombol raksasa bawah
        const targetWebAppUrl = `https://zetta-point-api-server.vercel.app/?v=1${finalInviterParam}`;

        // Kirim tombol menu raksasa tanpa ketikan teks kotor
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: id,
            text: `Woi ${first_name}! Selamat datang di Playzetta. Room chat sengaja gua bersihin biar gak berisik teks. 🪙🔥\n\nKlik tombol raksasa di bawah ini buat langsung buka game lu sekarang! 👇`,
            reply_markup: {
              keyboard: [
                [
                  {
                    text: "🎮 PLAY NOW & CLAIM BONUS",
                    web_app: { url: targetWebAppUrl }
                  }
                ]
              ],
              resize_keyboard: true,
              one_time_keyboard: false
            }
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error Webhook:', err);
    return NextResponse.json({ ok: false });
  }
}