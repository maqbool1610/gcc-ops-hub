-- ============================================================
-- GCC Ops Hub — Database Schema
-- Sprint 1 · Section 9 (Data Model)
-- Run this first in Supabase SQL Editor
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ───────────────────────────────────────────────────

CREATE TYPE company_type_enum AS ENUM (
  'PvtLtd', 'LLP', 'BranchOffice', 'Subsidiary'
);

CREATE TYPE employee_band_enum AS ENUM (
  '1-50', '51-100', '100-500', '500+'
);

CREATE TYPE vendor_category_enum AS ENUM (
  'CA', 'CS', 'Building', 'Payroll', 'Industry',
  'Insurance', 'Legal', 'Recruit', 'Custom'
);

CREATE TYPE activity_status_enum AS ENUM (
  'open', 'in_process', 'waiting', 'red_flag', 'closed'
);

CREATE TYPE activity_source_enum AS ENUM (
  'email', 'calendar', 'manual'
);

CREATE TYPE priority_enum AS ENUM (
  'high', 'medium', 'low'
);

CREATE TYPE user_role_enum AS ENUM (
  'gcc_head', 'hr_head', 'us_head', 'vendor'
);

-- ── TABLE: gcc ──────────────────────────────────────────────
-- One row per GCC organisation (Section 9.1)

CREATE TABLE gcc (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,                     -- "TechCorp India — Hyderabad GCC"
  company_name        TEXT        NOT NULL,                     -- Legal registered name
  city                TEXT        NOT NULL,
  registration_state  TEXT,                                     -- For regulatory calendar
  company_type        company_type_enum,
  employee_count_band employee_band_enum,
  foreign_subsidiary  BOOLEAN     DEFAULT false,               -- Triggers RBI/FEMA items
  gst_registered      BOOLEAN     DEFAULT true,                -- Triggers GST return items
  ops_email           TEXT,                                     -- Shared inbox e.g. ops@company.com
                                                               -- All vendors CC this address.
                                                               -- Sprint 3: system monitors this mailbox
                                                               -- instead of GCC Head's personal email.
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: vendors ──────────────────────────────────────────
-- One row per vendor per GCC (Section 9.2)

CREATE TABLE vendors (
  id            UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  gcc_id        UUID                 NOT NULL REFERENCES gcc(id) ON DELETE CASCADE,
  category      vendor_category_enum NOT NULL DEFAULT 'Custom',
  display_name  TEXT                 NOT NULL,
  short_code    TEXT                 NOT NULL CHECK (char_length(short_code) <= 4),
  firm_name     TEXT,
  contact_name  TEXT,
  contact_email TEXT,
  email_domains TEXT[]               DEFAULT '{}',             -- For auto-detection
  color_hex     TEXT                 DEFAULT '#6B7280',
  is_active     BOOLEAN              DEFAULT true,
  auto_detected BOOLEAN              DEFAULT false,
  created_at    TIMESTAMPTZ          DEFAULT NOW(),
  updated_at    TIMESTAMPTZ          DEFAULT NOW()
);

CREATE INDEX idx_vendors_gcc_id    ON vendors(gcc_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);

-- ── TABLE: users ────────────────────────────────────────────
-- Extends Supabase auth.users with app-level role and GCC (Section 9.5)
-- Note: id must match auth.users id

CREATE TABLE users (
  id                UUID           PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gcc_id            UUID           REFERENCES gcc(id) ON DELETE SET NULL,
  name              TEXT           NOT NULL,
  email             TEXT           NOT NULL,
  role              user_role_enum NOT NULL DEFAULT 'us_head',
  vendor_id         UUID           REFERENCES vendors(id) ON DELETE SET NULL,  -- Only for vendor role
  digest_subscribed BOOLEAN        DEFAULT true,
  created_at        TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX idx_users_gcc_id ON users(gcc_id);
CREATE INDEX idx_users_role   ON users(role);

-- ── TABLE: activities ───────────────────────────────────────
-- Core table — one row per tracked activity (Section 9.3)

CREATE TABLE activities (
  id               UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID                  NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title            TEXT                  NOT NULL,
  deadline         DATE,
  status           activity_status_enum  NOT NULL DEFAULT 'open',
  priority         priority_enum         DEFAULT 'medium',
  note             TEXT                  DEFAULT '',
  source           activity_source_enum  DEFAULT 'manual',
  blocked_by_id    UUID                  REFERENCES activities(id) ON DELETE SET NULL,
  is_recurring     BOOLEAN               DEFAULT false,
  recurrence_rule  TEXT,                                         -- e.g. "MONTHLY" (Phase 2)
  created_by       UUID                  REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by       UUID                  REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ           DEFAULT NOW(),
  updated_at       TIMESTAMPTZ           DEFAULT NOW()
);

CREATE INDEX idx_activities_vendor_id    ON activities(vendor_id);
CREATE INDEX idx_activities_status       ON activities(status);
CREATE INDEX idx_activities_deadline     ON activities(deadline);
CREATE INDEX idx_activities_blocked_by   ON activities(blocked_by_id) WHERE blocked_by_id IS NOT NULL;

-- ── TABLE: auditlog ─────────────────────────────────────────
-- Immutable audit trail (Section 9.4)
-- activity_id uses SET NULL so records survive activity deletion
-- activity_title_snapshot preserves the title even after deletion

CREATE TABLE auditlog (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id             UUID        REFERENCES activities(id) ON DELETE SET NULL,
  activity_title_snapshot TEXT,                                  -- Preserved if activity deleted
  user_display            TEXT        NOT NULL,
  user_role               TEXT        NOT NULL,
  action                  TEXT        NOT NULL,                  -- "Created" / "Updated status" / "Edited note" / "Deleted"
  field_changed           TEXT        NOT NULL,                  -- "status" / "note" / "title" / "deadline"
  from_value              TEXT,
  to_value                TEXT,
  timestamp               TIMESTAMPTZ NOT NULL DEFAULT NOW()     -- IMMUTABLE — no UPDATE/DELETE allowed
);

CREATE INDEX idx_auditlog_activity_id ON auditlog(activity_id);
CREATE INDEX idx_auditlog_timestamp   ON auditlog(timestamp DESC);

-- ── TABLE: emailcapture ─────────────────────────────────────
-- Staging table for AI-parsed email proposals (Section 9.6)
-- Populated in Sprint 3 (Email Intelligence)

CREATE TABLE emailcapture (
  id                    UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  gcc_id                UUID                 NOT NULL REFERENCES gcc(id) ON DELETE CASCADE,
  from_address          TEXT                 NOT NULL,
  email_subject         TEXT,
  received_at           TIMESTAMPTZ,
  ai_extracted_title    TEXT,
  ai_extracted_deadline DATE,
  ai_extracted_status   activity_status_enum,
  confirmed             BOOLEAN              DEFAULT false,
  linked_activity_id    UUID                 REFERENCES activities(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ          DEFAULT NOW()
);

CREATE INDEX idx_emailcapture_gcc_id    ON emailcapture(gcc_id);
CREATE INDEX idx_emailcapture_confirmed ON emailcapture(confirmed);
