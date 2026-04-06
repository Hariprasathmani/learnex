# LearnEx — Project Report

**Project Title:** LearnEx – Your Personal Learning Companion  
**Type:** Full-Stack Web Application  
**Date:** March 2026  

---

## 1. Project Overview

LearnEx is a personal learning management web application designed to help students and self-learners organize their study materials, track daily learning habits, plan study sessions, and get instant AI-powered academic assistance. The application combines note-taking, study planning, streak-based motivation, and a Gemini-powered chatbot into a single, unified platform.

---

## 2. Objectives

- Provide a centralized platform for managing personal study notes with optional PDF attachments
- Motivate consistent learning through a daily streak tracking system
- Enable structured study session planning with a built-in planner
- Offer instant AI tutoring via a Gemini-powered study assistant chatbot
- Ensure data privacy through per-user data isolation with Row Level Security

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | — | Application structure and semantic markup |
| **Vanilla CSS** | — | Custom styling, animations, responsive design |
| **JavaScript (ES Modules)** | ES2022+ | Application logic, state management, DOM manipulation |
| **Vite** | v7.1.9 | Development server, module bundling, hot reload |
| **Supabase JS Client** | v2.58.0 | Database, auth, and storage SDK |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18 | JavaScript runtime (built-in fetch used) |
| **Express.js** | v5.1.0 | HTTP server and routing |
| **dotenv** | v17.2.3 | Environment variable management |
| **cors** | v2.8.5 | Cross-Origin Resource Sharing |

### Database & Cloud Services
| Service | Purpose |
|---------|---------|
| **Supabase (PostgreSQL)** | Primary database, authentication, file storage |
| **Supabase Auth** | User registration, login, JWT session management |
| **Supabase Storage** | PDF file uploads (`note-files` bucket) |
| **Supabase Row Level Security** | Per-user data isolation at the database level |

### AI / ML
| Service | Purpose |
|---------|---------|
| **Google Gemini API** (`gemini-2.5-flash`) | AI chatbot responses via REST API |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                      │
│                                                     │
│   FRONTEND  (Vite + Vanilla JS/CSS/HTML)            │
│   Auth → Dashboard → Notes → Planner → Chatbot     │
│   Supabase JS SDK (auth, database, storage)         │
└────────────────┬──────────────────┬────────────────┘
                 │                  │
       Supabase REST API    localhost:3001/chat
                 │                  │
    ┌────────────▼───┐    ┌─────────▼──────────────┐
    │ SUPABASE CLOUD │    │  BACKEND (Express.js)  │
    │                │    │  hf-proxy.js           │
    │ PostgreSQL DB  │    │  • Hides Gemini API key│
    │ Auth (JWT)     │    │  • Proxies chat msgs   │
    │ Storage (PDFs) │    │  • Returns AI replies  │
    └────────────────┘    └──────────┬─────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  GOOGLE GEMINI API  │
                          │  gemini-2.5-flash   │
                          └─────────────────────┘
```

---

## 5. Features

### 5.1 Authentication
- **Sign Up** — Register with name, email, and password (min 6 characters)
- **Sign In** — Email/password login via Supabase Auth
- **Session Persistence** — Users stay logged in across page reloads via JWT tokens
- **Sign Out** — Clears session and returns to login page
- **Error Handling** — Clear messages for invalid credentials, unconfirmed emails, and network failures
- **Route Protection** — Unauthenticated users are automatically redirected to the login page

### 5.2 Dashboard
- **Stats Overview** — Real-time stat cards: Total Notes, Day Streak, PDF Files count
- **Daily Learning Streak** — Prominent streak counter with animated flame emoji (🔥)
- **Streak Logging** — "Log Today's Study Session" increments streak (one log per day enforced)
- **Recent Notes Preview** — Shows the 3 most recently created notes
- **Notification Messages** — Success/error alerts displayed inline on the dashboard

### 5.3 Notes Management
- **Create Notes** — Modal form with title and content fields
- **Edit Notes** — Inline edit via the same modal (pre-filled with existing data)
- **Delete Notes** — Confirmation prompt before deletion
- **PDF Attachments** — Upload optional PDF per note, stored in Supabase Storage
- **PDF Preview** — "View Attachment" link opens PDF in a new tab
- **Responsive Grid** — Card layout with hover lift effect
- **Empty State** — Friendly prompt when no notes exist yet

### 5.4 Study Planner
- **Add Sessions** — Plan study sessions with topic, target date, and duration (minutes)
- **Session List** — Sorted chronologically by due date
- **Mark Complete** — Toggle session as done (shown with ✔️ in green)
- **Delete Sessions** — Remove individual entries
- **Cloud Sync** — All sessions persisted in Supabase

### 5.5 AI Study Assistant (Chatbot)
- **Powered by Google Gemini** (`gemini-2.5-flash` model)
- **Secure API Proxy** — Gemini API key is server-side only, never exposed to the browser
- **Typing Indicator** — 3-dot animated bounce while AI is processing
- **Input Locking** — Input and Send button disabled during requests (prevents duplicate sends)
- **Markdown Rendering** — `**bold**`, `*italic*`, `` `code` `` rendered in bot replies
- **XSS Protection** — User input HTML-escaped before DOM insertion
- **Real Timestamps** — Messages show actual time (e.g., "09:45 AM")
- **Error Recovery** — Shows a clear ⚠️ message if backend is offline, instead of crashing

---

## 6. Database Schema

### Table: `notes`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Unique note ID |
| `user_id` | uuid | FK → auth.users, NOT NULL | Note owner |
| `title` | text | NOT NULL | Note title |
| `content` | text | — | Note body |
| `file_url` | text | nullable | Supabase Storage PDF URL |
| `created_at` | timestamptz | DEFAULT now() | Creation time |
| `updated_at` | timestamptz | DEFAULT now() | Last modified time |

### Table: `streaks`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique ID |
| `user_id` | uuid | FK → auth.users, UNIQUE | One record per user |
| `streak_count` | integer | DEFAULT 0 | Current streak days |
| `last_streak_date` | date | nullable | Last day a session was logged |
| `updated_at` | timestamptz | DEFAULT now() | Last update time |

### Table: `planner`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique ID |
| `user_id` | uuid | FK → auth.users, NOT NULL | Task owner |
| `task` | text | NOT NULL | Study topic |
| `due_date` | date | NOT NULL | Planned date |
| `duration` | integer | DEFAULT 30 | Duration in minutes |
| `completed` | boolean | DEFAULT false | Completion status |
| `created_at` | timestamptz | DEFAULT now() | Creation time |

---

## 7. Security Design

| Mechanism | Implementation |
|-----------|----------------|
| **Row Level Security (RLS)** | All tables enforce `auth.uid() = user_id` — complete data isolation between users |
| **JWT Auth** | Supabase issues signed JWTs; all DB calls verified server-side |
| **API Key Protection** | Gemini API key stored in `.env`, never sent to client |
| **XSS Prevention** | `escapeHtml()` applied to all user input before rendering |
| **Password Security** | Handled by Supabase Auth (bcrypt, salted) |
| **CORS** | Backend proxy uses `cors` middleware |

---

## 8. API Reference

### Backend Proxy — `http://localhost:3001`

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/` | — | `"Gemini proxy server is running"` |
| `POST` | `/chat` | `{ user_message: string }` | `{ choices: [{ message: { content: string } }] }` |

### Supabase SDK Operations

| Operation | Table/Bucket | Notes |
|-----------|-------------|-------|
| `SELECT *` | `notes` | Filtered by `user_id`, ordered by `created_at DESC` |
| `INSERT` | `notes` | Includes `user_id`, `title`, `content`, `file_url` |
| `UPDATE` | `notes` | Filtered by `id` AND `user_id` |
| `DELETE` | `notes` | Filtered by `id` AND `user_id` |
| `SELECT single` | `streaks` | Filtered by `user_id` |
| `UPSERT` | `streaks` | Conflict on `user_id` |
| `SELECT *` | `planner` | Filtered by `user_id`, ordered by `due_date ASC` |
| `INSERT` | `planner` | Topic, date, duration, completed=false |
| `UPDATE` | `planner` | Set `completed=true` |
| `DELETE` | `planner` | Filtered by `id` AND `user_id` |
| `upload` | `note-files` | Path: `{user_id}/{timestamp}.pdf` |
| `getPublicUrl` | `note-files` | Returns shareable PDF URL |

---

## 9. Project Structure

```
learnex/
├── frontend/
│   ├── index.html          # App shell — all 5 views defined here
│   ├── app.js              # All frontend logic (600+ lines)
│   ├── app.css             # Complete stylesheet with animations
│   ├── main.js             # Vite entry point
│   └── package.json
│
├── backend/
│   ├── hf-proxy.js         # Express Gemini API proxy (91 lines)
│   ├── .env                # Secret keys (gitignored)
│   ├── .env.example        # Setup template
│   └── package.json
│
├── backend/ (SQL Migrations — run in Supabase SQL Editor)
│   ├── 20251003143446_create_notes_table.sql
│   └── 20260331_create_missing_tables.sql
│
├── PROJECT_REPORT.md       # This document
└── README.md
```

---

## 10. Setup Instructions

```bash
# ── Step 1: Backend ──────────────────────────────────
cd learnex/backend
cp .env.example .env
# Fill in .env:
#   GEMINI_API_KEY=AIza...
#   VITE_SUPABASE_URL=https://xxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJ...
npm install
node hf-proxy.js
# ✅ Proxy running at http://localhost:3001

# ── Step 2: Frontend ─────────────────────────────────
cd learnex/frontend
npm install
npm run dev
# ✅ App running at http://localhost:5173

# ── Step 3: Database ─────────────────────────────────
# Go to: https://supabase.com/dashboard/project/<your-id>/sql/new
# Run both SQL migration files from /backend/ folder in order
```

---

## 11. Bugs Resolved

| # | Bug | Impact | Resolution |
|---|-----|--------|------------|
| 1 | Duplicate `DOMContentLoaded` listener | Routing broken on page load | Removed redundant early listener |
| 2 | `initAuthPage()` called twice | Form listeners doubled → double submissions | Removed explicit second call after `navigateToPage` |
| 3 | Duplicate `chat-form` submit listener | Every message sent twice | Removed global registration outside `initMainPage()` |
| 4 | Duplicate nav-item listeners calling removed `showView()` | Sidebar navigation broken | Removed global duplicates entirely |
| 5 | No try/catch in chatbot fetch | Silent crash when backend offline | Added full error handling with user-friendly messages |
| 6 | `showMessage('message-box', ...)` on dashboard | Streak alerts targeted hidden auth element | Fixed to `message-box-dashboard` |
| 7 | Missing `#message-box-dashboard` in HTML | No visible container for dashboard alerts | Added element to dashboard view |
| 8 | `streaks` table missing in Supabase | Streak feature entirely non-functional | Created via SQL migration |
| 9 | `planner` table missing in Supabase | Planner feature entirely non-functional | Created via SQL migration |
| 10 | `content` column missing from `notes` | Note content could not be saved | Added via `ALTER TABLE` |
| 11 | Streak consecutive-day logic inverted | Streak reset to 1 instead of incrementing | Fixed date comparison: check yesterday === lastDate |

---

## 12. Future Enhancements

| Feature | Description |
|---------|-------------|
| **AI Flashcards** | Generate flashcards from note content using Gemini |
| **Note Summarization** | One-click AI summary of any note |
| **Study Analytics** | Visual charts of weekly/monthly study patterns |
| **Tags & Categories** | Organize notes with custom labels and filters |
| **Collaborative Notes** | Share notes with other users via link |
| **PWA / Offline Mode** | Service worker for offline viewing |
| **Dark Mode** | Theme toggle with localStorage persistence |
| **Export** | Download notes as PDF or Markdown |
| **Push Notifications** | Browser reminders for upcoming study sessions |
| **Mobile App** | React Native port for iOS and Android |

---

*Report generated: March 31, 2026 | LearnEx v1.0*
