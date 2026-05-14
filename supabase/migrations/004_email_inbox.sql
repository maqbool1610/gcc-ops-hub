-- ─────────────────────────────────────────────────────────────────────────────
-- 004_email_inbox.sql
-- Email intelligence: raw inbox storage + Claude-grouped pending activities
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Raw email store ───────────────────────────────────────────────────────────
-- Stores each individual email fetched from Gmail.
-- gmail_id is the unique message ID from Gmail API.

CREATE TABLE IF NOT EXISTS email_inbox (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id     TEXT        UNIQUE NOT NULL,
  gcc_id       UUID        NOT NULL REFERENCES gcc(id)    ON DELETE CASCADE,
  vendor_id    UUID                 REFERENCES vendors(id) ON DELETE SET NULL,
  from_email   TEXT        NOT NULL,
  from_name    TEXT,
  subject      TEXT,
  body_preview TEXT,       -- first 800 chars of plain-text body
  received_at  TIMESTAMPTZ NOT NULL,
  processed    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_inbox_gcc_id_idx       ON email_inbox(gcc_id);
CREATE INDEX IF NOT EXISTS email_inbox_processed_idx    ON email_inbox(processed);
CREATE INDEX IF NOT EXISTS email_inbox_received_at_idx  ON email_inbox(received_at DESC);

-- ── Claude-grouped activity groups ───────────────────────────────────────────
-- One row per (vendor, category) topic.
-- Multiple emails on the same topic get their summaries appended to `updates`.
-- GCC Head reviews and either confirms (→ creates an activity) or dismisses.

CREATE TABLE IF NOT EXISTS email_activity_groups (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  gcc_id                UUID    NOT NULL REFERENCES gcc(id)    ON DELETE CASCADE,
  vendor_id             UUID             REFERENCES vendors(id) ON DELETE SET NULL,
  category              TEXT    NOT NULL,          -- e.g. "GST Filing"
  urgency               TEXT    NOT NULL DEFAULT 'medium',  -- low|medium|high|critical
  suggested_deadline    DATE,
  updates               JSONB   NOT NULL DEFAULT '[]',
  -- Each update: { email_id, gmail_id, summary, received_at, from_name, from_email }
  source_gmail_ids      TEXT[]  NOT NULL DEFAULT '{}',
  status                TEXT    NOT NULL DEFAULT 'pending',  -- pending|confirmed|dismissed
  confirmed_activity_id UUID             REFERENCES activities(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_groups_gcc_id_idx  ON email_activity_groups(gcc_id);
CREATE INDEX IF NOT EXISTS email_groups_status_idx  ON email_activity_groups(status);
CREATE INDEX IF NOT EXISTS email_groups_vendor_idx  ON email_activity_groups(vendor_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_email_group()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER email_group_updated_at
  BEFORE UPDATE ON email_activity_groups
  FOR EACH ROW EXECUTE FUNCTION touch_email_group();

-- ── Gmail sync state ──────────────────────────────────────────────────────────
-- Tracks the last historyId / timestamp so we only fetch new emails each run.

CREATE TABLE IF NOT EXISTS email_sync_state (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gcc_id            UUID        NOT NULL UNIQUE REFERENCES gcc(id) ON DELETE CASCADE,
  last_history_id   TEXT,       -- Gmail historyId for incremental sync
  last_synced_at    TIMESTAMPTZ,
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE email_inbox            ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_activity_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sync_state       ENABLE ROW LEVEL SECURITY;

-- GCC Head and HR Head can see all email data for their GCC
CREATE POLICY "email_inbox_gcc_read" ON email_inbox
  FOR ALL USING (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND gcc_id::text = auth.jwt()->>'gcc_id'
  );

CREATE POLICY "email_groups_gcc_read" ON email_activity_groups
  FOR ALL USING (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND gcc_id::text = auth.jwt()->>'gcc_id'
  );

CREATE POLICY "email_sync_state_gcc" ON email_sync_state
  FOR ALL USING (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND gcc_id::text = auth.jwt()->>'gcc_id'
  );

-- Service role (Edge Function) bypasses RLS automatically.
-- No additional grants needed for the edge function.

-- ── Seed: insert sync state row for the existing GCC ─────────────────────────
INSERT INTO email_sync_state (gcc_id)
SELECT id FROM gcc
ON CONFLICT (gcc_id) DO NOTHING;
