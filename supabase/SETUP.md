# Supabase Setup Guide — GCC Ops Hub Sprint 1

## Prerequisites

- Supabase account (Pro plan recommended for Auth Hook; free tier works with the fallback)
- Node.js 18+ installed locally

---

## Step 1 — Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `gcc-ops-hub`
3. Database password: choose a strong password (save it)
4. Region: **Asia (Mumbai)** — closest to Hyderabad
5. Wait ~2 minutes for provisioning

---

## Step 2 — Run SQL Files in Order

Open **SQL Editor** in your Supabase dashboard and run each file in sequence:

| Order | File | What it does |
|---|---|---|
| 1 | `01_schema.sql` | Creates all 6 tables and enums |
| 2 | `02_rls.sql` | Enables Row Level Security on all tables |
| 3 | `03_auth_hook.sql` | Defines the JWT claims hook function |
| 4 | `04_triggers.sql` | Audit log trigger + updated_at automation |
| 5 | `05_seed.sql` | Seeds 1 GCC + 8 default vendors |

**Important:** Run them in this exact order. Each file depends on the previous.

---

## Step 3 — Register the Auth Hook (Pro Plan)

1. Go to **Authentication → Hooks** in your Supabase dashboard
2. Under **Custom Access Token**, click **Add hook**
3. Select: Schema = `public`, Function = `custom_access_token_hook`
4. Save

**Free Plan users:** Skip this step and follow the Free Tier Fallback notes in `03_auth_hook.sql`. You'll need to update `02_rls.sql` to read claims from `app_metadata` instead.

---

## Step 4 — Edit the Seed Data

Open `05_seed.sql` and replace all placeholder values (marked `← Edit`):
- Company name, city, state
- Firm names and contact details for all 8 vendors
- Company type and employee band

Re-run the seed file after editing.

---

## Step 5 — Create Your GCC Head Account

1. In Supabase: **Authentication → Users → Add user**
2. Enter your email and set a password
3. Copy the UUID that appears in the Users list
4. In `05_seed.sql`, uncomment the GCC Head INSERT block
5. Paste your UUID and fill in your name/email
6. Run just that INSERT in the SQL Editor

---

## Step 6 — Get Your API Keys

Go to **Project Settings → API** and copy:
- `Project URL` (looks like `https://xxxx.supabase.co`)
- `anon / public` key

---

## Step 7 — Configure the React App

In the project root (`/GCCHub`), copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

---

## Step 8 — Install and Run

```bash
cd /path/to/GCCHub
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with your GCC Head credentials.

---

## Verifying Sprint 1 Checklist

After setup, test these scenarios:

- [ ] GCC Head can log in and see the vendor grid
- [ ] GCC Head can add a new vendor
- [ ] GCC Head can add activities to a vendor
- [ ] GCC Head can change activity status (audit entry appears in DB)
- [ ] GCC Head can edit a note (audit entry appears)
- [ ] GCC Head can set a "blocked by" dependency
- [ ] HR Head can log in, see activities, but cannot delete
- [ ] US Head can log in, sees vendor list (no individual activity notes)
- [ ] Vendor user can log in and sees only their own activities
- [ ] RLS: logging in as US Head via Supabase table editor shows no notes field bypass

---

## Troubleshooting

**"JWT claim not found" errors in RLS:**
The Auth Hook isn't registered. Either register it (Pro plan) or switch to app_metadata fallback (see `03_auth_hook.sql`).

**"row-level security policy for relation" error on login:**
The user profile row is missing from the `users` table. Run the INSERT from Step 5 in the SQL Editor.

**Vendor grid is empty after login:**
Check that the `gcc_id` in your `users` row matches the `id` in the `gcc` table.
