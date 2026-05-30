---
name: ZettaPoint Telegram WebApp Stack
description: Migration notes for ZettaPoint Next.js → Replit pnpm workspace (Vite + React + Express)
---

## Stack
- Frontend: Vite + React at artifacts/zettapoint, served via previewPath "/"
- API: Express 5 at artifacts/api-server, previewPath "/api"
- DB: PostgreSQL + Drizzle ORM at lib/db

## Key migration patterns
- "use client" directives → remove entirely (React, not Next.js)
- `next/link` Link → `wouter` Link (same API, no `prefetch` prop)
- `usePathname()` from next/navigation → `const [pathname] = useLocation()` from wouter
- `useRouter().push(url)` → `const [, navigate] = useLocation()` then `navigate(url)`
- `dynamic(() => import(...), { ssr: false })` → `const X = lazy(() => import(...))` + `<Suspense fallback={null}>`
- App.tsx uses `<WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>` 

## Loading behavior
The app shows a golden "✎﹏..." loading spinner in browser preview — this is correct.
AppProvider retries Telegram.WebApp.initDataUnsafe.user.id up to 10 times (5 seconds),
then sets loading=false with no user if not in Telegram. The HomePage shows the spinner
while loading=true. In Telegram, the user data is available and the app loads fully.

## DB tables seeded
- rooms: bronze ($20), silver ($100), gold ($500), diamond ($1000), 7-day reset cycles
- All other tables (users, tasks, task_completions, spin_records, transactions, leaderboard_winners) created via drizzle push

**Why:** Telegram WebApps only have user context inside Telegram. Browser preview will always show loading screen.
**How to apply:** When testing functionality, use a real Telegram bot or inject mock data.
