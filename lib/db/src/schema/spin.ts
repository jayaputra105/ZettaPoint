import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const spinRecords = pgTable("spin_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  lastFreeSpinAt: timestamp("last_free_spin_at"),
  adsSpinsToday: integer("ads_spins_today").default(0).notNull(),
  adsResetAt: timestamp("ads_reset_at").defaultNow().notNull(),
});

export type SpinRecord = typeof spinRecords.$inferSelect;
