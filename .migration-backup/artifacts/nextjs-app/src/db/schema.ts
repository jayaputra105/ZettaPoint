import { pgTable, serial, text, integer, boolean, timestamp, bigint, unique } from "drizzle-orm/pg-core";

// 1. TABEL USERS (Pusat Data Pemain)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique().notNull(),
  name: text("name").notNull(),
  username: text("username"),
  avatar: text("avatar"),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  usdtBalance: bigint("usdt_balance", { mode: "number" }).default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  
  // SOLUSI TON WALLET: Menyimpan address wallet user setelah connect
  tonWalletAddress: text("ton_wallet_address"),
  
  // SOLUSI REFERRAL: Mencatat ID user yang mengundang dia (Self-referencing relation)
  referrerId: integer("referrer_id"),
  
  // POINT ROOMS TRACKING
  zpBronze: bigint("zp_bronze", { mode: "number" }).default(0).notNull(),
  zpSilver: bigint("zp_silver", { mode: "number" }).default(0).notNull(),
  zpGold: bigint("zp_gold", { mode: "number" }).default(0).notNull(),
  zpDiamond: bigint("zp_diamond", { mode: "number" }).default(0).notNull(),
  
  // ROOM QUALIFICATIONS
  qualifiedSilver: boolean("qualified_silver").default(false).notNull(),
  qualifiedGold: boolean("qualified_gold").default(false).notNull(),
  qualifiedDiamond: boolean("qualified_diamond").default(false).notNull(),
  
  // SOLUSI DAILY RESET TRACKING: Untuk mencatat kapan terakhir absen/reset data harian
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
  dailyGameMinutes: integer("daily_game_minutes").default(0).notNull(), // Akumulasi menit main harian
  dailyAdsWatched: integer("daily_ads_watched").default(0).notNull(), // Jumlah ad yang ditonton hari ini
  streakDays: integer("streak_days").default(1).notNull(), // Counter login beruntun
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. TABEL TASKS (Daftar Tugas Induk)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Berisi: 'social' (klik link), 'screenshot' (bukti foto), atau 'system' (wallet, daily_login, referral, spin, mini_game)
  type: text("type").notNull(),
  
  // Untuk penanda internal sistem (contoh: 'ton_wallet', 'invite_3', 'play_5', 'daily_login')
  taskKey: text("task_key"),
  
  rewardCoins: integer("reward_coins").default(0).notNull(),
  link: text("link"),
  
  // Berisi: 'daily' (di-reset tiap jam 00:00) atau 'one_time' (sekali seumur hidup)
  category: text("category").default("one_time").notNull(),
  active: boolean("active").default(true).notNull(),
});

// 3. TABEL TASK COMPLETIONS (Catatan Tugas yang Dikerjakan User)
export const taskCompletions = pgTable(
  "task_completions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
    
    // Berisi: 'pending' (butuh review screenshot) atau 'completed' (hadiah sudah cair)
    status: text("status").default("pending").notNull(),
    screenshotUrl: text("screenshot_url"),
    claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.taskId)]
);

// 4. TABEL ROOMS (Pengaturan Pool Hadiah Tiap Room)
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(), // 'bronze', 'silver', 'gold', 'diamond'
  prizePool: integer("prize_pool").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  durationDays: integer("duration_days").notNull(),
});

// 5. TABEL LEADERBOARD WINNERS (Catatan Sejarah Pemenang Tiap Season)
export const leaderboardWinners = pgTable("leaderboardWinners", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(),
  prizeAmount: text("prize_amount").notNull(),
  wonAt: timestamp("won_at").defaultNow().notNull(),
});

// 6. TABEL SPIN RECORDS (Data Roda Putar Keberuntungan)
export const spinRecords = pgTable("spin_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  lastFreeSpinAt: timestamp("last_free_spin_at"),
  adsSpinsToday: integer("ads_spins_today").default(0).notNull(),
  adsResetAt: timestamp("ads_reset_at").defaultNow().notNull(),
});

// 7. TABEL TRANSACTIONS (Catatan Riwayat Deposit / Withdraw USDT)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // 'deposit' atau 'withdraw'
  amount: text("amount").notNull(),
  currency: text("currency").notNull(), // 'USDT', 'TON', dll
  method: text("method"),
  walletAddress: text("wallet_address"),
  status: text("status").default("pending").notNull(), // 'pending', 'success', 'failed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TYPE INFERENCE FOR TYPESCRIPT CONVENIENCE
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type SpinRecord = typeof spinRecords.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;