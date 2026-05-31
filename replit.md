# ZettaPoint

ZettaPoint adalah Telegram WebApp P2E (Play-to-Earn) game berbasis koin dan kompetisi room leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/zettapoint run dev` — jalankan web app (Vite)
- `pnpm run typecheck` — full typecheck semua packages
- `pnpm run build` — typecheck + build semua packages
- `pnpm --filter @workspace/db run push` — push DB schema changes ke Neon (dev only, set DATABASE_URL dulu)
- Required env: `DATABASE_URL` — Postgres connection string (local Replit DB untuk dev)
- Required env (production): `DATABASE_URL` = nilai `NEON_DATABASE_URL` — Neon Postgres untuk production

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Vite + React + Wouter + Tailwind + Framer Motion (`artifacts/zettapoint/`)
- API: Express 5 (`artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM (`lib/db/`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Deploy: Vercel (serverless via `api/index.ts`, SPA rewrite, cron daily reset)

## Where things live

- `artifacts/zettapoint/src/` — web app (pages, components, context)
- `artifacts/zettapoint/src/context/AppProvider.tsx` — global state + bootstrap fetch
- `artifacts/api-server/src/routes/` — semua API routes (user, rooms, tasks, spin, wallet, referral, leaderboard, cron)
- `lib/db/src/schema/` — source of truth untuk DB schema (Drizzle)
- `api/index.ts` — Vercel serverless handler (import Express app)
- `vercel.json` — Vercel config (build, rewrites SPA, cron, functions)

## Architecture decisions

- API pakai relative URL `/api/...` dari frontend — works di dev (Replit proxy) dan production (Vercel rewrite)
- Vercel serverless: Express app di-wrap di `api/index.ts`, semua `/api/*` diroute ke satu function
- Cron job `0 0 * * *` (UTC midnight) reset semua rooms via `GET /api/cron/reset-rooms`
- Dev pakai Replit local PostgreSQL (`DATABASE_URL`); production pakai Neon (`NEON_DATABASE_URL` → set sebagai `DATABASE_URL` di Vercel env)
- Vite config pakai default PORT/BASE_PATH (tidak throw jika tidak ada) agar bisa build di Vercel

## Product

- Tap-to-earn koin dengan multiplier upgradeable
- 4 competition rooms (Bronze, Silver, Gold, Diamond) — leaderboard reset weekly, winner dapat USDT
- Spin wheel harian, tasks, referral system
- Auto-click upgrade via Telegram Stars
- TON wallet integration

## User preferences

- Jangan ganti tampilan/design yang sudah ada
- Web only — mobile app dihapus

## Gotchas

- Untuk deploy ke Vercel: set `DATABASE_URL` = Neon URL di Vercel Environment Variables
- Setelah push schema baru: `DATABASE_URL=<neon_url> pnpm --filter @workspace/db run push`
- `CRON_SECRET` bisa di-set di Vercel env untuk keamanan cron endpoint (optional, tapi recommended)
- Vercel cron hanya jalan di production deploy (bukan preview)

## Pointers

- Neon DB: `ep-calm-bread-apqc45nb-pooler.c-7.us-east-1.aws.neon.tech`
- Rooms di-seed manual: 4 rooms (bronze 100 USDT, silver 300, gold 1000, diamond 5000 prize pool, 7-day reset)
- Tasks di-seed: 11 tasks (4 daily, 7 one-time) — sudah ada di DB
