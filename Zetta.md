# Workspace

## Overview

pnpm workspace monorepo menggunakan TypeScript. Setiap package mengelola dependensinya sendiri.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: Next.js 15 (App Router)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM neonserverless
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (dari OpenAPI spec)
- **Styling**: Tailwind CSS v4
- **Build**: esbuild (CJS bundle untuk API), Next.js build untuk frontend

## Artifacts

- `artifacts/nextjs-app` — Aplikasi Next.js (App Router, Tailwind CSS, TypeScript)
- `artifacts/api-server` — Express 5 API server

## Key Commands

- `pnpm run typecheck` — full typecheck di semua packages
- `pnpm run build` — typecheck + build semua packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks dan Zod schemas dari OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — jalankan API server secara lokal
- `pnpm --filter @workspace/nextjs-app run dev` — jalankan Next.js app secara lokal

## Project: Zetta Clicker (Telegram Mini App Style)

Dark glossy galaxy black + gold aesthetic, Telegram mini-app style clicker game.

### Pages
room selector

- `/` — Home: Coin clicker dengan cooldown system (1 free click/jam + max 15 ad clicks/jam), shooting stars background, neon gold header
- `/tasks` — Misi Harian: Social tasks (Verify button) + screenshot upload tasks
- `/spin` — Spin & Menang: 6-segment roulette wheel, daily free spin + ad-based spins (max 5/hari)
- `/leaderboard` — Leaderboard: Podium top 3 + daftar top 100
- `/wallet` — Dompet: Saldo koin + USDT, withdraw ke TON/USDT/
- `/minigames` _ minigames: Gamezop

### Database Tables (PostgreSQL)

- `users` — id, telegram_id, name, username, avatar, coins, rank
- `tasks` — id, title, description, type (social/screenshot), reward_coins, link
- `task_completions` — id, user_id, task_id, status, screenshot_url
- `spin_records` — id, user_id, last_free_spin_at, ads_spins_today, ads_reset_at
- `transactions` — id, user_id, type, amount, currency, method, wallet_address, status
- `room` — zp_bronze dll

### API Routes (via api-server at /api/*)

- `GET/PATCH /api/user` — user data
- `GET/POST /api/tasks` — tasks list + submit completion
- `GET/POST /api/spin` — spin state + execute spin
- `GET /api/leaderboard` — top 100 users
- `GET/POST /api/wallet` — wallet balance + withdraw

### Key Notes

- API routes are on `artifacts/api-server` (Express), NOT Next.js API routes (Replit proxy sends /api/* to api-server)
- Drizzle schema for Zetta tables is in `lib/db/src/schema/zetta.ts`
- Mock user: telegram_id = 'mock_001', id = 1 (Zetta Hunter)
- `framer-motion` and `lucide-react` must be in `dependencies` (not devDependencies) in nextjs-app
- `transpilePackages: ["framer-motion"]` required in next.config.ts

## Next.js App Structure

```
artifacts/nextjs-app/src/
├── app/
│   ├── page.tsx           # Home (clicker + cooldown)
│   ├── tasks/page.tsx     # Misi Harian
│   ├── spin/page.tsx      # Roulette Spin
│   ├── leaderboard/page.tsx
│   ├── wallet/page.tsx
│   └── api/               # Unused (routing goes to api-server)
└── components/
    ├── BottomNav.tsx       # Navigation (uses Next.js Link + usePathname)
    ├── CoinClicker.tsx     # Animated golden coin
    ├── AdModal.tsx         # 5s fake ad modal
    └── ShootingStars.tsx   # Canvas background animation
```
