/*
  # Create notes table for LearnEx application

  1. New Tables
    - `notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `user_id` (uuid, foreign key) - References auth.users, owner of the note
      - `title` (text) - Title of the note
      - `file_url` (text, optional) - URL to uploaded PDF file in Supabase Storage
      - `created_at` (timestamptz) - Timestamp when note was created
      - `updated_at` (timestamptz) - Timestamp when note was last updated

  2. Security
    - Enable RLS on `notes` table
    - Add policy for users to read their own notes
    - Add policy for users to insert their own notes
    - Add policy for users to update their own notes
    - Add policy for users to delete their own notes

  3. Important Notes
    - All policies restrict access to authenticated users only
    - Users can only access notes where user_id matches their auth.uid()
    - This ensures complete data isolation between users
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  file_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);