import { pgTable, serial, text, integer, boolean, timestamp, bigint, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  name: text("name").notNull(),
  username: text("username"),
  avatar: text("avatar"),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  usdtBalance: bigint("usdt_balance", { mode: "number" }).default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  

  zpBronze: bigint("zp_bronze", { mode: "number" }).default(0).notNull(),
  zpSilver: bigint("zp_silver", { mode: "number" }).default(0).notNull(),
  zpGold: bigint("zp_gold", { mode: "number" }).default(0).notNull(),
  zpDiamond: bigint("zp_diamond", { mode: "number" }).default(0).notNull(),
  
  qualifiedSilver: boolean("qualified_silver").default(false).notNull(),
  qualifiedGold: boolean("qualified_gold").default(false).notNull(),
  qualifiedDiamond: boolean("qualified_diamond").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(), // 'bronze', 'silver', 'gold', 'diamond'
  prizePool: integer("prize_pool").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  durationDays: integer("duration_days").notNull(),
});


export const leaderboardWinners = pgTable("leaderboard_winners", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  userId: integer("user_id").notNull(),
  rank: integer("rank").notNull(),
  prizeAmount: text("prize_amount").notNull(), 
  wonAt: timestamp("won_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  link: text("link"),
  active: boolean("active").default(true).notNull(),
});

export const taskCompletions = pgTable(
  "task_completions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    taskId: integer("task_id").notNull(),
    status: text("status").default("pending").notNull(),
    screenshotUrl: text("screenshot_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.taskId)]
);

export const spinRecords = pgTable("spin_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  lastFreeSpinAt: timestamp("last_free_spin_at"),
  adsSpinsToday: integer("ads_spins_today").default(0).notNull(),
  adsResetAt: timestamp("ads_reset_at").defaultNow().notNull(), 
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
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
