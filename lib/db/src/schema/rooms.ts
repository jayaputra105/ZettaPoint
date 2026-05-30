import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  prizePool: integer("prize_pool").notNull(),
  resetAt: timestamp("reset_at").notNull(),
  durationDays: integer("duration_days").notNull(),
});

export const leaderboardWinners = pgTable("leaderboard_winners", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rank: integer("rank").notNull(),
  prizeAmount: text("prize_amount").notNull(),
  wonAt: timestamp("won_at").defaultNow().notNull(),
});
