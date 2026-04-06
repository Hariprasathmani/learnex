# LearnEx v2 (Multi-Page Architecture)

A personal study and productivity companion built with Vanilla JS, Vite, Express, and Supabase.

## ✨ Features
1. **Dashboard:** Study streak tracking & stats.
2. **Pomodoro Timer:** Visual SVGs, Web Audio bells, and DB sync.
3. **Study Planner:** Schedule and complete study sessions.
4. **Notes System:** Rich notes with multi-file drag-and-drop attachments (PDFs, Images, Docs).
5. **AI Assistant:** Google Gemini chatbot proxy for learning help.

## 🗂 Project Structure
\`\`\`
learnex/
├── frontend/
│   ├── index.html        (redirects to auth)
│   ├── auth.html         (login & registration)
│   ├── dashboard.html
│   ├── notes.html
│   ├── planner.html
│   ├── chat.html
│   ├── timer.html
│   ├── vite.config.js    (multi-page Rollup config)
│   ├── js/
│   │   ├── auth-guard.js (session validation)
│   │   ├── supabase.js   (client singleton)
│   │   ├── nav.js        (sidebar rendering)
│   │   └── [page].js     (page-specific logic)
│   └── css/
│       ├── base.css
│       ├── components.css
│       └── layout.css
├── backend/
│   ├── hf-proxy.js       (Gemini secure proxy server)
│   └── .env
└── migrations/
    ├── 001_notes_content_column.sql
    ├── 002_create_streaks.sql
    ├── 003_create_planner.sql
    ├── 004_create_note_files.sql
    └── 005_pomodoro_column.sql
\`\`\`

## 🚀 Setup Steps

### 1. Database (Supabase)
Run the migration files in the `migrations/` folder in the exact order numbered:
1. `001_notes_content_column.sql`
2. `002_create_streaks.sql`
3. `003_create_planner.sql`
4. `004_create_note_files.sql`
5. `005_pomodoro_column.sql`

Ensure you have a Storage bucket named `note-files` initialized as **public**.

### 2. Backend Config
Navigate to `backend/` and copy the template:
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

**Environment Variables Required:**
- `GEMINI_API_KEY`: Your Google AI Studio API key
- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key

Install dependencies & start proxy:
\`\`\`bash
npm install
node hf-proxy.js
# Runs on localhost:3001
\`\`\`

### 3. Frontend Config
Navigate to `frontend/`:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Vite will now start on `http://localhost:5173`. Open in browser — it will securely redirect to `auth.html`.
