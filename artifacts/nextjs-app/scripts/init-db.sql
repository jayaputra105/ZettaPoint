-- ========================================
-- ZETTA POINT DATABASE INITIALIZATION
-- ========================================
-- Run this script to recreate all tables fresh

-- Drop existing tables if they exist (WARNING: This will delete all data!)
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "leaderboardWinners" CASCADE;
DROP TABLE IF EXISTS "leaderboard_winners" CASCADE;
DROP TABLE IF EXISTS "task_completions" CASCADE;
DROP TABLE IF EXISTS "spin_records" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "rooms" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- ========================================
-- 1. USERS TABLE
-- ========================================
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"telegram_id" text UNIQUE NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"avatar" text,
	"coins" bigint DEFAULT 0 NOT NULL,
	"usdt_balance" bigint DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"ton_wallet_address" text,
	"referrer_id" integer,
	
	-- POINT ROOMS TRACKING
	"zp_bronze" bigint DEFAULT 0 NOT NULL,
	"zp_silver" bigint DEFAULT 0 NOT NULL,
	"zp_gold" bigint DEFAULT 0 NOT NULL,
	"zp_diamond" bigint DEFAULT 0 NOT NULL,
	
	-- ROOM QUALIFICATIONS
	"qualified_silver" boolean DEFAULT false NOT NULL,
	"qualified_gold" boolean DEFAULT false NOT NULL,
	"qualified_diamond" boolean DEFAULT false NOT NULL,
	
	-- DAILY RESET TRACKING
	"last_login_at" timestamp DEFAULT now() NOT NULL,
	"daily_game_minutes" integer DEFAULT 0 NOT NULL,
	"daily_ads_watched" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 1 NOT NULL,
	
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");
CREATE INDEX "users_rank_idx" ON "users"("rank");

-- ========================================
-- 2. TASKS TABLE
-- ========================================
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL, -- 'social', 'screenshot', 'system'
	"task_key" text,
	"reward_coins" integer DEFAULT 0 NOT NULL,
	"link" text,
	"category" text DEFAULT 'one_time' NOT NULL, -- 'daily' or 'one_time'
	"active" boolean DEFAULT true NOT NULL
);

CREATE INDEX "tasks_active_idx" ON "tasks"("active");
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- ========================================
-- 3. TASK COMPLETIONS TABLE
-- ========================================
CREATE TABLE "task_completions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"task_id" integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"status" text DEFAULT 'pending' NOT NULL, -- 'pending', 'completed'
	"screenshot_url" text,
	"claimed_at" timestamp DEFAULT now() NOT NULL,
	
	CONSTRAINT "task_completions_user_id_task_id_key" UNIQUE("user_id", "task_id")
);

CREATE INDEX "task_completions_user_id_idx" ON "task_completions"("user_id");
CREATE INDEX "task_completions_task_id_idx" ON "task_completions"("task_id");

-- ========================================
-- 4. ROOMS TABLE
-- ========================================
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY, -- 'bronze', 'silver', 'gold', 'diamond'
	"prize_pool" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"duration_days" integer NOT NULL
);

-- ========================================
-- 5. LEADERBOARD WINNERS TABLE
-- ========================================
CREATE TABLE "leaderboardWinners" (
	"id" serial PRIMARY KEY,
	"room_id" text NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"rank" integer NOT NULL, -- 1, 2, 3 (top 3)
	"prize_amount" text NOT NULL,
	"won_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "leaderboardWinners_room_id_idx" ON "leaderboardWinners"("room_id");
CREATE INDEX "leaderboardWinners_user_id_idx" ON "leaderboardWinners"("user_id");
CREATE INDEX "leaderboardWinners_won_at_idx" ON "leaderboardWinners"("won_at");

-- ========================================
-- 6. SPIN RECORDS TABLE
-- ========================================
CREATE TABLE "spin_records" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
	"last_free_spin_at" timestamp,
	"ads_spins_today" integer DEFAULT 0 NOT NULL,
	"ads_reset_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "spin_records_user_id_idx" ON "spin_records"("user_id");

-- ========================================
-- 7. TRANSACTIONS TABLE
-- ========================================
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"type" text NOT NULL, -- 'deposit', 'withdrawal', 'room_rewards'
	"amount" text NOT NULL,
	"currency" text NOT NULL, -- 'USDT', 'TON', 'COINS'
	"method" text,
	"wallet_address" text,
	"status" text DEFAULT 'pending' NOT NULL, -- 'pending', 'success', 'failed'
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- ========================================
-- DONE!
-- ========================================
