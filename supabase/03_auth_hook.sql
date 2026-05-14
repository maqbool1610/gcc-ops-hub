-- ============================================================
-- GCC Ops Hub — Custom Access Token Hook
-- Sprint 1 · Section 10.2 (Supabase Auth Hook)
-- Run AFTER 01_schema.sql and 02_rls.sql
-- ============================================================
-- REQUIREMENTS: Supabase Pro plan (or Team/Enterprise)
-- This hook fires on every token mint and injects custom
-- claims (user_role, gcc_id, vendor_id) into the JWT so
-- RLS policies can use them without extra queries.
--
-- REGISTRATION STEPS (after running this SQL):
--   1. Go to Supabase Dashboard → Authentication → Hooks
--   2. Under "Custom Access Token Hook", click "Add hook"
--   3. Select: Schema = public, Function = custom_access_token_hook
--   4. Save. Test by signing in — check JWT claims at jwt.io
--
-- FREE TIER ALTERNATIVE:
--   If you are on Supabase Free tier, the Custom Access Token
--   Hook is not available. Use the fallback approach at the
--   bottom of this file instead.
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_role  text;
  v_gcc_id     text;
  v_vendor_id  text;
  claims       jsonb;
BEGIN
  -- Look up the user's app role and GCC from our users table
  SELECT
    role::text,
    gcc_id::text,
    vendor_id::text
  INTO v_user_role, v_gcc_id, v_vendor_id
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- Start from the existing claims
  claims := event->'claims';

  -- Inject custom claims (prefixed to avoid collision with standard JWT fields)
  IF v_user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_user_role));
  END IF;

  IF v_gcc_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{gcc_id}', to_jsonb(v_gcc_id));
  END IF;

  IF v_vendor_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{vendor_id}', to_jsonb(v_vendor_id));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Allow supabase_auth_admin to call this function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Lock down to prevent misuse
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM authenticated, anon, public;


-- ============================================================
-- FREE TIER FALLBACK — app_metadata approach
-- ============================================================
-- If the Custom Access Token Hook is unavailable, store role
-- and gcc_id in the user's app_metadata via the Supabase
-- Admin API or a service-role call after user creation.
--
-- Example Admin API call (from your backend/edge function):
--   supabase.auth.admin.updateUserById(userId, {
--     app_metadata: { user_role: 'gcc_head', gcc_id: '...' }
--   })
--
-- Then update RLS policies to read from app_metadata:
--   auth.jwt()->'app_metadata'->>'user_role'   (instead of auth.jwt()->>'user_role')
--   auth.jwt()->'app_metadata'->>'gcc_id'      (instead of auth.jwt()->>'gcc_id')
--
-- Search and replace in 02_rls.sql:
--   auth.jwt()->>'user_role'  →  auth.jwt()->'app_metadata'->>'user_role'
--   auth.jwt()->>'gcc_id'     →  auth.jwt()->'app_metadata'->>'gcc_id'
--   auth.jwt()->>'vendor_id'  →  auth.jwt()->'app_metadata'->>'vendor_id'
-- ============================================================
