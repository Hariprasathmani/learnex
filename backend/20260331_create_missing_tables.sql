/*
  # LearnEx — Missing Tables Migration
  Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

  Creates:
    1. streaks  — tracks each user's daily study streak
    2. planner  — stores study plan sessions
  Patches:
    3. notes    — adds missing `content` column if not present
*/

-- ─────────────────────────────────────────
-- 1. PATCH notes: add content column
-- ─────────────────────────────────────────
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content text;

-- ─────────────────────────────────────────
-- 2. streaks table
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  streak_count    integer DEFAULT 0 NOT NULL,
  last_streak_date date,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON streaks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS streaks_user_id_idx ON streaks(user_id);

-- ─────────────────────────────────────────
-- 3. planner table
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planner (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task       text NOT NULL,
  due_date   date NOT NULL,
  duration   integer NOT NULL DEFAULT 30,
  completed  boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own planner"
  ON planner FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planner"
  ON planner FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planner"
  ON planner FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planner"
  ON planner FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS planner_user_id_idx ON planner(user_id);
CREATE INDEX IF NOT EXISTS planner_due_date_idx ON planner(due_date ASC);
