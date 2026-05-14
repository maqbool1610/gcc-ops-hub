-- ============================================================
-- GCC Ops Hub — Row Level Security Policies
-- Sprint 1 · Section 10.2
-- Run AFTER 01_schema.sql
-- ============================================================
-- JWT claims injected by the Custom Access Token Hook (03_auth_hook.sql):
--   auth.jwt()->>'user_role'  → 'gcc_head' | 'hr_head' | 'us_head' | 'vendor'
--   auth.jwt()->>'gcc_id'     → UUID of the user's GCC
--   auth.jwt()->>'vendor_id'  → UUID of the vendor (only for 'vendor' role)
-- ============================================================

-- ── ENABLE RLS ON ALL TABLES ────────────────────────────────
ALTER TABLE gcc          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditlog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE emailcapture ENABLE ROW LEVEL SECURITY;

-- ── GCC TABLE ───────────────────────────────────────────────

-- All authenticated users can read their own GCC
CREATE POLICY "gcc_read_own" ON gcc
  FOR SELECT
  USING (id = (auth.jwt()->>'gcc_id')::uuid);

-- GCC Head can update their GCC
CREATE POLICY "gcc_head_update" ON gcc
  FOR UPDATE
  USING (
    id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- ── VENDORS TABLE ───────────────────────────────────────────

-- GCC Head + HR Head: read all vendors in their GCC
CREATE POLICY "gcc_hr_head_vendors_select" ON vendors
  FOR SELECT
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
  );

-- US Head: read-only vendors in their GCC
CREATE POLICY "us_head_vendors_select" ON vendors
  FOR SELECT
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'us_head'
  );

-- Vendor: read their own vendor record only
CREATE POLICY "vendor_read_own_vendor" ON vendors
  FOR SELECT
  USING (
    id = (auth.jwt()->>'vendor_id')::uuid
    AND auth.jwt()->>'user_role' = 'vendor'
  );

-- GCC Head only: create vendors
CREATE POLICY "gcc_head_vendors_insert" ON vendors
  FOR INSERT
  WITH CHECK (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- GCC Head only: update vendors
CREATE POLICY "gcc_head_vendors_update" ON vendors
  FOR UPDATE
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- GCC Head only: delete (deactivate) vendors
CREATE POLICY "gcc_head_vendors_delete" ON vendors
  FOR DELETE
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- ── ACTIVITIES TABLE ────────────────────────────────────────
-- Activities are accessed via their parent vendor's gcc_id

-- GCC Head + HR Head: read all activities in their GCC
CREATE POLICY "gcc_hr_head_activities_select" ON activities
  FOR SELECT
  USING (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = activities.vendor_id
        AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
    )
  );

-- GCC Head + HR Head: create activities in their GCC
CREATE POLICY "gcc_hr_head_activities_insert" ON activities
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = vendor_id
        AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
    )
  );

-- GCC Head + HR Head: update activities in their GCC
CREATE POLICY "gcc_hr_head_activities_update" ON activities
  FOR UPDATE
  USING (
    auth.jwt()->>'user_role' IN ('gcc_head', 'hr_head')
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = activities.vendor_id
        AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
    )
  );

-- GCC Head ONLY: delete activities
CREATE POLICY "gcc_head_activities_delete" ON activities
  FOR DELETE
  USING (
    auth.jwt()->>'user_role' = 'gcc_head'
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = activities.vendor_id
        AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
    )
  );

-- US Head: read-only — notes are hidden in the frontend
-- Phase 2: create a view that excludes the note column for US Head
CREATE POLICY "us_head_activities_select" ON activities
  FOR SELECT
  USING (
    auth.jwt()->>'user_role' = 'us_head'
    AND EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = activities.vendor_id
        AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
    )
  );

-- Vendor: read their own activities only
CREATE POLICY "vendor_activities_select" ON activities
  FOR SELECT
  USING (
    auth.jwt()->>'user_role' = 'vendor'
    AND vendor_id = (auth.jwt()->>'vendor_id')::uuid
  );

-- Vendor: update status on their own activities only
-- (title, deadline, note changes blocked in app layer)
CREATE POLICY "vendor_activities_update" ON activities
  FOR UPDATE
  USING (
    auth.jwt()->>'user_role' = 'vendor'
    AND vendor_id = (auth.jwt()->>'vendor_id')::uuid
  )
  WITH CHECK (
    auth.jwt()->>'user_role' = 'vendor'
    AND vendor_id = (auth.jwt()->>'vendor_id')::uuid
  );

-- ── AUDITLOG TABLE ──────────────────────────────────────────
-- GCC Head: read-only, no direct write by any role
-- Inserts happen exclusively via the SECURITY DEFINER trigger (04_triggers.sql)

CREATE POLICY "gcc_head_auditlog_select" ON auditlog
  FOR SELECT
  USING (
    auth.jwt()->>'user_role' = 'gcc_head'
    AND (
      -- Logs for existing activities in user's GCC
      EXISTS (
        SELECT 1 FROM activities a
        JOIN vendors v ON v.id = a.vendor_id
        WHERE a.id = auditlog.activity_id
          AND v.gcc_id = (auth.jwt()->>'gcc_id')::uuid
      )
      -- Also show logs for deleted activities (activity_id IS NULL)
      -- Identified by their gcc through a snapshot approach — GCC Head sees all
      OR activity_id IS NULL
    )
  );

-- No INSERT/UPDATE/DELETE policies — all writes go through the SECURITY DEFINER trigger

-- ── USERS TABLE ─────────────────────────────────────────────

-- Every user can read their own profile
CREATE POLICY "users_read_own_profile" ON users
  FOR SELECT
  USING (id = auth.uid());

-- GCC Head can read all users in their GCC
CREATE POLICY "gcc_head_read_all_users" ON users
  FOR SELECT
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- GCC Head can create new users in their GCC
CREATE POLICY "gcc_head_insert_users" ON users
  FOR INSERT
  WITH CHECK (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- GCC Head can update users in their GCC
CREATE POLICY "gcc_head_update_users" ON users
  FOR UPDATE
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- GCC Head can delete users from their GCC
CREATE POLICY "gcc_head_delete_users" ON users
  FOR DELETE
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- Users can update their own profile (e.g. name, digest_subscribed)
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- ── EMAILCAPTURE TABLE ──────────────────────────────────────
-- Sprint 3 (Email Intelligence) — foundation policies only

-- GCC Head: full access
CREATE POLICY "gcc_head_emailcapture_all" ON emailcapture
  FOR ALL
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'gcc_head'
  );

-- HR Head: read-only
CREATE POLICY "hr_head_emailcapture_select" ON emailcapture
  FOR SELECT
  USING (
    gcc_id = (auth.jwt()->>'gcc_id')::uuid
    AND auth.jwt()->>'user_role' = 'hr_head'
  );
