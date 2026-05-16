-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Email timeline support
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Store Gmail thread ID in email_inbox so we can match reply chains
ALTER TABLE email_inbox
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;

CREATE INDEX IF NOT EXISTS idx_email_inbox_thread_id
  ON email_inbox (gmail_thread_id);

-- 2. Structured email history on each activity.
--    Each element: { gmail_id, gmail_thread_id, from_name, from_email,
--                   subject, received_at, summary }
--    Populated automatically by the edge function — never edited manually.
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS timeline JSONB NOT NULL DEFAULT '[]'::jsonb;

-- GIN index lets Postgres efficiently search inside the JSONB array
-- (used when matching by gmail_thread_id to find the right activity)
CREATE INDEX IF NOT EXISTS idx_activities_timeline_gin
  ON activities USING GIN (timeline jsonb_path_ops);
