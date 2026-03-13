# PomoPets — Web App

The full React web application for PomoPets. Includes the public landing and waitlist, the in-game experience, admin panel, and all Supabase integrations.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router v7** — client-side routing with protected routes
- **Supabase JS v2** — auth, database queries, storage, RPC functions
- **CSS custom properties** — no UI library; hand-written design system

## Project Structure

```
web/
├── public/              # Static assets (fonts, images, logo)
├── src/
│   ├── components/
│   │   ├── admin/       # Admin panel components (tables, panels, pet manager)
│   │   └── pomodoro/    # Timer ring, controls, task list, session cards
│   ├── context/
│   │   └── AuthContext.tsx   # Global auth + profile state
│   ├── hooks/
│   │   ├── usePomodoroSession.ts
│   │   └── usePomodoroTimer.ts
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── auditLog.ts       # Fire-and-forget audit event logger
│   ├── pages/               # One file per route
│   ├── types/
│   │   ├── pets.ts
│   │   └── pomodoro.ts
│   └── App.tsx              # Route definitions
└── vercel.json              # SPA rewrite rule for Vercel
```

## Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in / sign up |
| `/waitlist` | Public waitlist signup |
| `/join/:token` | VIP token join page |
| `/studio/:secret` | Admin panel (triple-gated) |
| `/profile-setup` | First-time profile setup |
| `/home` | Game home with active pet |
| `/shop` | Egg shop |
| `/hatchery` | Egg incubation and hatching |
| `/pets` | Pet collection |
| `/pomodoro` | Study timer |
| `/health` | Health logging |
| `/habits` | Habit tracking |
| `/settings` | Profile and account settings |

## Local Development

```bash
cd web
npm install
npm run dev
```

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_SECRET=your_admin_url_slug
VITE_ADMIN_PASSWORD=your_admin_password
```

## Build & Deploy

```bash
npm run build   # outputs to dist/
```

Deployed via Vercel. The `vercel.json` rewrite rule ensures deep routes (e.g. `/studio/...`) work correctly on refresh.

> **Note:** Make sure Vercel's root directory is set to `web/` in the project settings.

## Supabase Setup

Run the SQL in `docs/supabase_db_schema.md` to create all required tables, RPC functions, and RLS policies. Create a `pet-assets` Storage bucket (public) for pet and egg images.
