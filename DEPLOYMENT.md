# GCC Ops Hub — Deployment Guide
**From zero to live website in ~45 minutes**

---

## What you'll have at the end

- A live website at `https://gcc-ops-hub.vercel.app` (or a name you choose)
- A Supabase database with all tables, security, and your seed data
- A GCC Head account you can log in with
- Every future code push to GitHub automatically redeploys the site

---

## Accounts you need (all free)

| Service | What for | Cost |
|---|---|---|
| [supabase.com](https://supabase.com) | Database + auth + backend | Free tier (or Pro at $25/mo for Auth Hook) |
| [github.com](https://github.com) | Code repository | Free |
| [vercel.com](https://vercel.com) | Hosting the React app | Free |

---

## PART A — Supabase Setup (~20 min)

### A1. Create the project

1. Go to [supabase.com](https://supabase.com) → **Sign up / Log in**
2. Click **New project**
3. Fill in:
   - **Name:** `gcc-ops-hub`
   - **Database password:** choose something strong — save it in a password manager
   - **Region:** `Southeast Asia (Singapore)` — closest to Hyderabad
   - **Plan:** Free (or Pro if you want the Auth Hook)
4. Click **Create new project** — wait 2–3 minutes for it to provision

### A2. Edit the seed file first

Before running anything in Supabase, open `supabase/05_seed.sql` in VS Code or Notepad and replace every `← Edit` placeholder:

```
YOUR_COMPANY_NAME          →  e.g. TechCorp India
Hyderabad                  →  your city (or keep)
Telangana                  →  state of registration
PvtLtd                     →  your company type
51-100                     →  your employee band
true / true                →  foreign subsidiary? GST registered?
ops@YOUR_COMPANY.com       →  your shared ops email (see Part E below)

Vendor firm names:         →  your actual CA firm, CS firm, etc.
Vendor contact emails:     →  real email addresses for auto-detection later
```

Save the file after editing.

### A3. Run the SQL files in order

In Supabase: click **SQL Editor** in the left sidebar.

Run each file in this exact sequence — paste the entire contents and click **Run**:

| # | File | What happens |
|---|---|---|
| 1 | `supabase/01_schema.sql` | Creates all 6 tables |
| 2 | `supabase/02_rls.sql` | Locks down data by role |
| 3 | `supabase/03_auth_hook.sql` | Defines JWT claims function |
| 4 | `supabase/04_triggers.sql` | Sets up audit trail automation |
| 5 | `supabase/05_seed.sql` (edited) | Seeds your GCC + 8 vendors |

After each run, check that you see **"Success. No rows returned"** (or similar green confirmation). If you see a red error, stop and fix it before continuing.

### A4. Register the Custom Access Token Hook (Pro plan only)

> Skip this step if you are on the Free plan. Instead, follow the **Free Tier Fallback** section at the bottom of `supabase/03_auth_hook.sql`.

1. In Supabase: **Authentication → Hooks**
2. Under **Custom Access Token**, click **Add hook**
3. Set: Schema = `public`, Function = `custom_access_token_hook`
4. Click **Save**

### A5. Create your GCC Head login

**Step 1 — Create the auth account:**
1. Supabase: **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your email and a password
4. Click **Create user**
5. Copy the **UUID** shown in the Users list (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Step 2 — Create the profile row:**

In **SQL Editor**, run this (replacing the placeholders):

```sql
INSERT INTO users (id, gcc_id, name, email, role)
VALUES (
  'PASTE-YOUR-UUID-HERE',
  'a0000000-0000-0000-0000-000000000001',
  'Your Full Name',
  'your@email.com',
  'gcc_head'
);
```

### A6. Get your API keys

1. Supabase: **Project Settings → API** (gear icon in the sidebar)
2. Copy these two values — you'll need them in Part C:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public** key — long string starting with `eyJ...`

---

## PART B — Push code to GitHub (~5 min)

Open a terminal. Navigate to the GCCHub folder:

```bash
cd "C:\Users\Maq\Documents\Claude\Projects\GCCHub"
```

Initialise Git and make your first commit:

```bash
git init
git add .
git commit -m "Sprint 1: initial GCC Ops Hub build"
```

Go to [github.com](https://github.com) → click **New repository**:
- Name: `gcc-ops-hub`
- Visibility: **Private** (this contains your business config)
- Do NOT tick "Add a README" — your repo already has files

Copy the two commands GitHub shows you under **"push an existing repository"** — they look like:

```bash
git remote add origin https://github.com/YOUR_USERNAME/gcc-ops-hub.git
git branch -M main
git push -u origin main
```

Run those in your terminal. Your code is now on GitHub.

---

## PART C — Test locally first (~5 min)

Before deploying, make sure everything works on your machine.

In the GCCHub folder, create `.env.local` (copy from the example):

```bash
# Windows — in the terminal:
copy .env.example .env.local
```

Open `.env.local` and fill in your Supabase values from Part A6:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Install dependencies and start the local server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Test checklist:**
- [ ] Login page appears
- [ ] Sign in with your GCC Head email and password
- [ ] Vendor grid loads with your 8 vendors
- [ ] Clicking a vendor shows the activity list
- [ ] "Add activity" form works and saves to the database
- [ ] Status change on an activity reflects immediately

If login fails with "Email not confirmed", go to Supabase → **Authentication → Settings → Email** and turn off **"Confirm email"** for development.

Once local works, you're ready to go live.

---

## PART D — Deploy to Vercel (~5 min)

### D1. Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (use your GitHub account)
2. Click **Add New → Project**
3. Find **gcc-ops-hub** in the list → click **Import**

### D2. Configure the project

On the configuration screen:
- **Framework Preset:** Vite *(Vercel should detect this automatically)*
- **Root Directory:** leave blank (the project root is correct)
- **Build Command:** `npm run build` *(auto-filled)*
- **Output Directory:** `dist` *(auto-filled)*

Scroll down to **Environment Variables** — add these two:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

### D3. Deploy

Click **Deploy**. Vercel will:
1. Pull your code from GitHub
2. Run `npm install` + `npm run build`
3. Serve it globally

After ~60 seconds you'll see a green **Congratulations!** screen.

Your live URL will be something like `https://gcc-ops-hub-maq.vercel.app`

Click it — you should see the GCC Ops Hub login page.

### D4. Update Supabase redirect URL

One last step to make login work correctly on the live site:

1. Supabase: **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://gcc-ops-hub-maq.vercel.app`
3. Under **Redirect URLs**, add: `https://gcc-ops-hub-maq.vercel.app/**`
4. Save

Test login on the live URL — you're done.

---

## PART E — The Shared Ops Email

This is the feature you suggested, and it's a genuinely better approach than the original BRD's personal OAuth.

### Why it's better

| Personal OAuth (original BRD) | Shared ops email (your idea) |
|---|---|
| GCC Head shares personal Gmail login | Dedicated, role-appropriate mailbox |
| Vendors mix with personal email | Only vendor emails land here |
| Privacy concerns | Zero personal data exposure |
| OAuth token refresh complexity | One stable connection |
| Hard to hand off to someone else | Any admin can access it |

### Recommended email address name

**`ops@yourcompany.com`** — my top recommendation. Short, professional, clearly "operations." Works for any industry.

Other good options:
- `compliance@yourcompany.com` — very explicit for audit/compliance context
- `hub@yourcompany.com` — matches the product name nicely
- `vendors@yourcompany.com` — self-explanatory to anyone who receives the CC request

Avoid: `admin@` (too generic, implies system access), `info@` (too broad).

### How to set it up right now (free, using Gmail)

Since you don't have a custom domain yet, the easiest path:

1. **Create a dedicated Gmail account**: `yourcompany.gcc.ops@gmail.com`
   - Use the company laptop / shared device — not your personal Google
   - This becomes the ops mailbox Sprint 3 will monitor

2. **Tell every vendor to CC this address** on all emails sent to the GCC Head:
   > *"Please copy ops-gcc@gmail.com on all emails related to our compliance activities. This helps us track updates automatically."*

3. **When you have a custom domain later**, create `ops@yourcompany.com` and forward it (or switch to Google Workspace). Sprint 3 connects to whatever email you choose.

### What Sprint 3 will do with this

- GCC Head does a one-time Gmail login to connect `ops@gmail.com`
- Supabase Edge Function polls this inbox every hour
- Claude API reads each new email, extracts: vendor → activity → status signal
- GCC Head sees a confirmation card: *"New activity proposed: GSTR-3B filing — confirm?"*
- One click confirms. Activity appears in the dashboard. Audit trail entry created.

No vendor ever touches the dashboard. No manual data entry. The email they were already sending becomes the data source.

---

## PART F — Future deployments

After the initial setup, every code update is:

```bash
# Make your changes, then:
git add .
git commit -m "describe what you changed"
git push
```

Vercel detects the push and automatically redeploys in ~60 seconds. Zero manual steps.

---

## Troubleshooting

**Login works locally but not on Vercel:**
Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel's Environment Variables. After adding them, redeploy (Vercel → Deployments → Redeploy).

**"row-level security policy" error after login:**
The user profile row is missing from the `users` table. Run the INSERT from Part A5, Step 2.

**Vendor grid is empty:**
The `gcc_id` in your `users` row doesn't match the `id` in the `gcc` table. Both should be `a0000000-0000-0000-0000-000000000001`.

**Auth Hook not working (JWT claims missing):**
Either the hook isn't registered (check Authentication → Hooks) or you're on the Free plan. Use the app_metadata fallback from `supabase/03_auth_hook.sql`.

**"Email confirmation required" on login:**
Go to Supabase → Authentication → Settings → Email → disable "Confirm email" for development. For production, configure SMTP (Supabase Settings → Auth → SMTP).

**Build fails on Vercel:**
Check the build logs. Usually a missing environment variable or a syntax error. Run `npm run build` locally first — if it passes locally, the Vercel build will pass too.

---

## Cost summary at launch

| Service | Plan | Monthly cost |
|---|---|---|
| Supabase | Free tier | ₹0 |
| Vercel | Hobby (free) | ₹0 |
| Gmail ops mailbox | Personal Gmail | ₹0 |
| **Total** | | **₹0/month** |

When you move to a custom domain: ~₹800–1,200/year for the domain. If you upgrade to Supabase Pro for the Auth Hook: $25/month.
