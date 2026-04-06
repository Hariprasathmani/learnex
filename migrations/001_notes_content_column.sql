-- Migration 001: Add content column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content text;
