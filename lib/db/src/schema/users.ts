import { pgTable, serial, text, integer, boolean, timestamp, bigint } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique().notNull(),
  name: text("name").notNull(),
  username: text("username"),
  avatar: text("avatar"),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  usdtBalance: bigint("usdt_balance", { mode: "number" }).default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  tonWalletAddress: text("ton_wallet_address"),
  referrerId: integer("referrer_id"),
  zpBronze: bigint("zp_bronze", { mode: "number" }).default(0).notNull(),
  zpSilver: bigint("zp_silver", { mode: "number" }).default(0).notNull(),
  zpGold: bigint("zp_gold", { mode: "number" }).default(0).notNull(),
  zpDiamond: bigint("zp_diamond", { mode: "number" }).default(0).notNull(),
  qualifiedSilver: boolean("qualified_silver").default(false).notNull(),
  qualifiedGold: boolean("qualified_gold").default(false).notNull(),
  qualifiedDiamond: boolean("qualified_diamond").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
  dailyGameMinutes: integer("daily_game_minutes").default(0).notNull(),
  dailyAdsWatched: integer("daily_ads_watched").default(0).notNull(),
  streakDays: integer("streak_days").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  multiplierLevel: integer("multiplier_level").default(0).notNull(),
  multiplierResetAt: timestamp("multiplier_reset_at"),
  autoClickEnabled: boolean("auto_click_enabled").default(false).notNull(),
});

export type User = typeof users.$inferSelect;
