# Email Intelligence Setup Guide
## GCC Ops Hub — Sprint 3

This guide walks through connecting ops@criticalys.com Gmail to the app
so vendor emails are automatically parsed by Claude and surfaced for review.

---

## What you'll need (15–20 min total)

1. Anthropic API key (3 min)
2. Google Cloud project + Gmail API enabled (8 min)
3. Gmail OAuth refresh token (5 min)
4. Supabase secrets + SQL migration (3 min)
5. Deploy the edge function (2 min)

---

## Step 1 — Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Sign in → **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Keep it safe — you'll use it in Step 4

---

## Step 2 — Google Cloud setup

### 2a. Create a project
1. Go to https://console.cloud.google.com
2. Click the project dropdown (top left) → **New Project**
3. Name it: `GCC Ops Hub`
4. Click **Create**

### 2b. Enable Gmail API
1. In the new project, go to **APIs & Services → Library**
2. Search for **Gmail API**
3. Click it → **Enable**

### 2c. Create OAuth credentials
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User type: **Internal** (since it's your own Google Workspace)
   - App name: `GCC Ops Hub`
   - Save and continue through the steps
4. Back in Credentials → Create OAuth client ID:
   - Application type: **Web application**
   - Name: `GCC Ops Hub Server`
   - Authorized redirect URIs: add `https://developers.google.com/oauthplayground`
   - Click **Create**
5. Copy and save:
   - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-...`)

---

## Step 3 — Get the Gmail refresh token

We need a one-time refresh token for ops@criticalys.com that lets the
server read Gmail on your behalf indefinitely.

1. Go to https://developers.google.com/oauthplayground

2. Click the ⚙️ gear icon (top right) → check:
   - **Use your own OAuth credentials**
   - Paste your Client ID and Client Secret from Step 2c

3. In the left panel, find **Gmail API v1** → select:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - Click **Authorize APIs**

4. Sign in with **ops@criticalys.com** when prompted

5. Click **Exchange authorization code for tokens**

6. Copy the **Refresh token** value — this is what the server uses

---

## Step 4 — Run the SQL migration

In your Supabase project:
1. Go to **SQL Editor**
2. Copy the contents of `supabase/migrations/004_email_inbox.sql`
3. Paste and click **Run**

---

## Step 5 — Set Supabase secrets

Install the Supabase CLI if you haven't:
```bash
npm install -g supabase
supabase login
supabase link --project-ref ficfayffvebqcpfrglrx
```

Then set all secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
supabase secrets set GMAIL_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
supabase secrets set GMAIL_CLIENT_SECRET=GOCSPX-YOUR_SECRET
supabase secrets set GMAIL_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
```

Verify they're set:
```bash
supabase secrets list
```

---

## Step 6 — Deploy the edge function

```bash
supabase functions deploy process-emails --no-verify-jwt
```

The `--no-verify-jwt` flag allows the function to also run on a cron
schedule (not just from authenticated user requests).

---

## Step 7 — Set up hourly auto-sync (optional but recommended)

In Supabase → **SQL Editor**, run:

```sql
-- Requires pg_cron extension (enable in Database → Extensions first)
select cron.schedule(
  'process-emails-hourly',
  '0 * * * *',   -- every hour at :00
  $$
    select net.http_post(
      url    := 'https://ficfayffvebqcpfrglrx.supabase.co/functions/v1/process-emails',
      body   := '{}',
      headers:= '{"Content-Type":"application/json","Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb
    )
  $$
);
```

Replace `YOUR_ANON_KEY` with: `sb_publishable_9Dnp4Y8QD6D4qQD9VP56ZA_vXk8ZQgo`

---

## Step 8 — Test it

1. Send a test email to ops@criticalys.com from one of your vendor contacts
   (or forward an existing vendor email to that inbox)

2. In the app, click **✉ Inbox** (top bar on desktop, or Inbox tab on mobile)

3. Click **Sync now**

4. The email should appear as a grouped card within 30 seconds

5. Review it, assign a vendor if needed, and click **+ Add to tracker**

---

## How it works (what Claude sees)

For each email, the edge function sends this to Claude:

- From, Subject, Date, Body (first 2000 chars)
- Your list of vendors (to match sender to vendor)

Claude extracts:
- **Category** — the operational topic (e.g. "GST Filing", "Payroll Processing")
- **Summary** — one clear sentence about what this email says
- **Deadline** — any date mentioned
- **Urgency** — low / medium / high / critical
- **Vendor match** — which of your vendors sent this

Multiple emails on the same topic from the same vendor get **grouped together**
under one card — so you see a clean thread view, not email chaos.

---

## Troubleshooting

**"Token refresh failed"**
→ The refresh token may have expired. Repeat Step 3.

**"No emails showing"**
→ Make sure emails are in the `ops@criticalys.com` INBOX (not a subfolder).
→ The function fetches emails from the last 7 days on first run.

**"Vendor not matched"**
→ Claude couldn't match the sender to a known vendor. Use the
   "Assign vendor" button on the card to set it manually.

**Edge function errors**
→ Check logs: `supabase functions logs process-emails`

---

## Security notes

- The refresh token only grants `gmail.readonly` access — it cannot send, 
  delete, or modify any emails.
- All secrets are stored encrypted in Supabase — never in your codebase.
- The edge function runs in an isolated Deno environment.
- RLS policies ensure only GCC Head / HR Head can see inbox data.
