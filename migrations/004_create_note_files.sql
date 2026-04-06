-- Migration 004: Multi-file attachments junction table
CREATE TABLE IF NOT EXISTS note_files (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id    uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name  text NOT NULL,
  file_url   text NOT NULL,
  file_type  text,
  file_size  integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE note_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user files"
  ON note_files FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS note_files_note_id_idx ON note_files(note_id);
CREATE INDEX IF NOT EXISTS note_files_user_id_idx ON note_files(user_id);
