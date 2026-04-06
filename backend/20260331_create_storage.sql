-- SQL script to create the 'note-files' bucket and set up policies

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-files', 'note-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view files (since we use getPublicUrl)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'note-files');

-- 3. Allow authenticated users to upload files to the bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'note-files');

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'note-files' AND auth.uid() = owner);

-- 5. Create the note_files table if it doesn't exist already
CREATE TABLE IF NOT EXISTS note_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE note_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own note files" ON note_files 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note files" ON note_files 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own note files" ON note_files 
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
