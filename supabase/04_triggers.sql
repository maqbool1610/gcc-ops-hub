-- ============================================================
-- GCC Ops Hub — Database Triggers
-- Sprint 1 · Section 7 (Audit Trail) + updated_at automation
-- Run AFTER 01_schema.sql
-- ============================================================

-- ── HELPER: updated_at auto-stamp ───────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_jwt_claims jsonb;
  v_user_id    uuid;
BEGIN
  NEW.updated_at = NOW();

  -- Also stamp updated_by if the user is known
  BEGIN
    v_jwt_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
    v_user_id    := (v_jwt_claims->>'sub')::uuid;
    IF v_user_id IS NOT NULL THEN
      NEW.updated_by := v_user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- silently ignore if no JWT context (e.g. direct DB access)
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ── AUDIT LOG TRIGGER ───────────────────────────────────────
-- Captures every INSERT, UPDATE, and DELETE on activities.
-- Uses SECURITY DEFINER to bypass RLS when inserting into auditlog
-- (no role has a direct INSERT policy on auditlog).
--
-- Reads the acting user from the JWT claims set by Supabase
-- per connection via current_setting('request.jwt.claims').
-- Falls back to 'System / auto' for scheduled jobs and migrations.

CREATE OR REPLACE FUNCTION log_activity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_display text := 'System';
  v_user_role    text := 'auto';
  v_user_id      uuid;
  v_jwt_claims   jsonb;
BEGIN
  -- Identify the acting user from the Supabase JWT
  BEGIN
    v_jwt_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
    v_user_id    := (v_jwt_claims->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF v_user_id IS NOT NULL THEN
    SELECT
      COALESCE(u.name, 'Unknown User'),
      COALESCE(u.role::text, v_jwt_claims->>'user_role', 'auto')
    INTO v_user_display, v_user_role
    FROM public.users u
    WHERE u.id = v_user_id;

    -- Fallback if user not in users table yet
    v_user_display := COALESCE(v_user_display, 'Unknown User');
    v_user_role    := COALESCE(v_user_role, 'auto');
  END IF;

  -- ── INSERT → log "Created" ──────────────────────────────
  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditlog
      (activity_id, activity_title_snapshot, user_display, user_role,
       action, field_changed, from_value, to_value)
    VALUES
      (NEW.id, NEW.title, v_user_display, v_user_role,
       'Created', 'status', NULL, NEW.status::text);
    RETURN NEW;
  END IF;

  -- ── UPDATE → log each changed field separately ──────────
  IF TG_OP = 'UPDATE' THEN

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO auditlog
        (activity_id, activity_title_snapshot, user_display, user_role,
         action, field_changed, from_value, to_value)
      VALUES
        (NEW.id, NEW.title, v_user_display, v_user_role,
         'Updated status', 'status', OLD.status::text, NEW.status::text);
    END IF;

    IF OLD.note IS DISTINCT FROM NEW.note THEN
      INSERT INTO auditlog
        (activity_id, activity_title_snapshot, user_display, user_role,
         action, field_changed, from_value, to_value)
      VALUES
        (NEW.id, NEW.title, v_user_display, v_user_role,
         'Edited note', 'note', OLD.note, NEW.note);
    END IF;

    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO auditlog
        (activity_id, activity_title_snapshot, user_display, user_role,
         action, field_changed, from_value, to_value)
      VALUES
        (NEW.id, NEW.title, v_user_display, v_user_role,
         'Updated title', 'title', OLD.title, NEW.title);
    END IF;

    IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
      INSERT INTO auditlog
        (activity_id, activity_title_snapshot, user_display, user_role,
         action, field_changed, from_value, to_value)
      VALUES
        (NEW.id, NEW.title, v_user_display, v_user_role,
         'Updated deadline', 'deadline', OLD.deadline::text, NEW.deadline::text);
    END IF;

    IF OLD.blocked_by_id IS DISTINCT FROM NEW.blocked_by_id THEN
      INSERT INTO auditlog
        (activity_id, activity_title_snapshot, user_display, user_role,
         action, field_changed, from_value, to_value)
      VALUES
        (NEW.id, NEW.title, v_user_display, v_user_role,
         'Updated dependency', 'blocked_by_id',
         OLD.blocked_by_id::text, NEW.blocked_by_id::text);
    END IF;

    RETURN NEW;
  END IF;

  -- ── DELETE → log "Deleted" (activity_id set to NULL via FK) ──
  IF TG_OP = 'DELETE' THEN
    INSERT INTO auditlog
      (activity_id, activity_title_snapshot, user_display, user_role,
       action, field_changed, from_value, to_value)
    VALUES
      (NULL, OLD.title, v_user_display, v_user_role,
       'Deleted', 'status', OLD.status::text, NULL);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER activity_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION log_activity_changes();


-- ── NIGHTLY RED FLAG AUTO-PROMOTION ─────────────────────────
-- Sprint 2 will wire this to a Supabase pg_cron job.
-- The function is defined here so Sprint 2 can schedule it.
--
-- Promotes any Open/In Process/Waiting activity past its
-- deadline to Red Flag. Runs nightly at 00:05 IST (18:35 UTC).

CREATE OR REPLACE FUNCTION auto_promote_red_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE activities
  SET
    status     = 'red_flag',
    updated_at = NOW()
  WHERE
    status IN ('open', 'in_process', 'waiting')
    AND deadline < CURRENT_DATE;
END;
$$;

-- To schedule (Sprint 2 — enable pg_cron extension first):
-- SELECT cron.schedule(
--   'nightly-red-flag-promotion',
--   '35 18 * * *',   -- 00:05 IST = 18:35 UTC
--   'SELECT auto_promote_red_flags()'
-- );
