import { pgTable, serial, text, integer, boolean, timestamp, bigint, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  name: text("name").notNull(),
  username: text("username"),
  avatar: text("avatar"),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
