-- Migration 002: Create streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  streak_count     integer DEFAULT 0 NOT NULL,
  last_streak_date date,
  pomodoros_today  integer DEFAULT 0 NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak"
  ON streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS streaks_user_id_idx ON streaks(user_id);
