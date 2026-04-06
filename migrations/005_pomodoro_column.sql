-- Migration 005: Add pomodoros_today to streaks (already included in 002 if run fresh)
ALTER TABLE streaks ADD COLUMN IF NOT EXISTS pomodoros_today integer DEFAULT 0 NOT NULL;
