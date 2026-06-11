# 🎵 Phill the Groove

> A retro record-shop music recommendation community. Recommend songs, react with color icons, earn points, climb the ranks.

---

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend / Auth / DB**: Supabase
- **Deployment**: GitHub + Netlify

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd phill-the-groove
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and run the entire contents of `supabase_schema.sql`.
3. Copy your **Project URL** and **anon/public API key** from Project Settings → API.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

---

## Netlify Deployment

1. Push your repo to GitHub.
2. In Netlify → **Add new site** → Import from GitHub.
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Under **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. The `public/_redirects` file handles SPA client-side routing automatically.

---

## Features

| Feature | Description |
|---|---|
| 📰 Public Feed | Anyone can browse recommendations |
| 🎵 Drop a Pick | Logged-in users post song recommendations |
| 🔴 Color Reactions | 5 emoji reactions that translate to scorer points |
| 🔥 Today's Vibe | Daily featured track with the most 🔴 reactions |
| ⭐ Rate Songs | Dedicated queue to rate unrated picks |
| 🏆 Leaderboard | Top curators ranked by score |
| 👤 Profile | Per-user page with rank, progress bar, all picks |
| 📦 My Archive | My picks + posts I've reacted to, with reaction history |
| 🔐 Auth | Email sign-up/sign-in via Supabase Auth |

## Rank System

| Points | Rank |
|---|---|
| 0–50 | 🌱 Newbie Digger |
| 51–200 | 🎧 Vibe Dealer |
| 201–500 | 🔥 Taste Maker |
| 501–1000 | 💎 Curator |
| 1001+ | 👑 Legend of the Groove |

Score is automatically updated via Supabase database triggers — no client-side score logic needed.
