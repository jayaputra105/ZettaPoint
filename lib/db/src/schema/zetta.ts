cat << 'EOF' > /lib/db / src / schema / zetta.ts
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
  
  // TON WALLET
  tonWalletAddress: text("ton_wallet_address"),
  
  // REFERRAL SYSTEM
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
  
  // DAILY RESET TRACKING
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
  dailyGameMinutes: integer("daily_game_minutes").default(0).notNull(),
  dailyAdsWatched: integer("daily_ads_watched").default(0).notNull(),
  streakDays: integer("streak_days").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. TABEL TASKS (Daftar Tugas Induk)
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  taskKey: text("task_key"),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  link: text("link"),
  category: text("category").default("one_time").notNull(),
  active: boolean("active").default(true).notNull(),
});

// 3. TABEL TASK COMPLETIONS (Catatan Tugas Player)
export const taskCompletions = pgTable(
  "task_completions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
    status: text("status").default("pending").notNull(),
    screenshotUrl: text("screenshot_url"),
    claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.taskId)]
);

// 4. TABEL ROOMS (Pengaturan Pool Hadiah Tiap Room)
export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  prizePool: integer("prize_pool").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  durationDays: integer("duration_days").notNull(),
});

// 5. TABEL LEADERBOARD WINNERS (Catatan Sejarah Pemenang)
export const leaderboardWinners = pgTable("leaderboardWinners", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(),
  prizeAmount: text("prize_amount").notNull(),
  wonAt: timestamp("won_at").defaultNow().notNull(),
});

// 6. TABEL SPIN RECORDS
export const spinRecords = pgTable("spin_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  lastFreeSpinAt: timestamp("last_free_spin_at"),
  adsSpinsToday: integer("ads_spins_today").default(0).notNull(),
  adsResetAt: timestamp("ads_reset_at").defaultNow().notNull(),
});

// 7. TABEL TRANSACTIONS
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  method: text("method"),
  walletAddress: text("wallet_address"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type SpinRecord = typeof spinRecords.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
EOF