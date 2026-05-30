import { pgTable, serial, text, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";

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

export type Task = typeof tasks.$inferSelect;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
