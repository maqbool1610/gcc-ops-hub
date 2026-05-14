-- ============================================================
-- GCC Ops Hub — Seed Data
-- Sprint 1 · One GCC + 8 default vendors
-- Run AFTER 01_schema.sql through 04_triggers.sql
-- ============================================================
-- INSTRUCTIONS:
--   1. Replace 'YOUR_COMPANY_NAME' and 'YOUR_CITY' below
--   2. Run this SQL in the Supabase SQL Editor
--   3. After running, create your GCC Head user account:
--      a. Go to Authentication → Users → "Invite user"
--         OR use the sign-up form in the app
--      b. Then run the INSERT at the bottom to create their
--         profile row in the users table
-- ============================================================

-- ── GCC ROW ─────────────────────────────────────────────────
-- Replace placeholder values with your real company details

INSERT INTO gcc (
  id, name, company_name, city,
  registration_state, company_type,
  employee_count_band, foreign_subsidiary, gst_registered, ops_email
) VALUES (
  'a0000000-0000-0000-0000-000000000001',  -- Fixed UUID for easy reference
  'CRITICALYS — Hyderabad GCC',     -- ← Edit: e.g. "TechCorp India — Hyderabad GCC"
  'CRITICALYS India Pvt Ltd',        -- ← Edit: legal registered name
  'Hyderabad',                              -- ← Edit: your city
  'Telangana',                              -- ← Edit: state of registration
  'PvtLtd',                                -- ← Edit: PvtLtd / LLP / BranchOffice / Subsidiary
  '51-100',                                -- ← Edit: 1-50 / 51-100 / 100-500 / 500+
  true,                                    -- ← Edit: true if foreign subsidiary (RBI/FEMA items)
  true,                                    -- ← Edit: true if GST registered
  'ops@criticalys.com'                   -- ← Edit: shared inbox all vendors will CC
                                           --   Suggested names: ops@ / compliance@ / hub@
                                           --   Sprint 3 will monitor this address for activity emails
);

-- ── 8 DEFAULT VENDORS ───────────────────────────────────────
-- Edit firm names and contact details to match your actual vendors.
-- short_code must be ≤ 4 characters.
-- color_hex values match Section 11.3 of the BRD exactly.

INSERT INTO vendors (
  gcc_id, category, display_name, short_code,
  firm_name, contact_name, contact_email,
  email_domains, color_hex, is_active
) VALUES
  -- CA — Chartered Accountant
  (
    'a0000000-0000-0000-0000-000000000001',
    'CA', 'Chartered Accountant', 'CA',
    'Sharma & Associates',           -- ← Edit
    'Rajesh Sharma',                 -- ← Edit
    'rajesh@sharmaassoc.com',        -- ← Edit (used for email auto-detection)
    ARRAY['sharmaassoc.com'],        -- ← Edit: email domain(s)
    '#3B82F6', true
  ),
  -- CS — Company Secretary
  (
    'a0000000-0000-0000-0000-000000000001',
    'CS', 'Company Secretary', 'CS',
    'Legal Compliance Partners',     -- ← Edit
    'Priya Nair',                    -- ← Edit
    'priya@lcp.co.in',              -- ← Edit
    ARRAY['lcp.co.in'],             -- ← Edit
    '#8B5CF6', true
  ),
  -- Building / Facility
  (
    'a0000000-0000-0000-0000-000000000001',
    'Building', 'Building / Facility', 'Bldg',
    'Smartworks Raidurg',            -- ← Edit
    'Ops Team',                      -- ← Edit
    'ops@smartworks.in',             -- ← Edit
    ARRAY['smartworks.in'],          -- ← Edit
    '#F59E0B', true
  ),
  -- Payroll
  (
    'a0000000-0000-0000-0000-000000000001',
    'Payroll', 'Payroll', 'Pay',
    'ADP India Pvt Ltd',             -- ← Edit
    'Kavitha Reddy',                 -- ← Edit
    'kavitha@adp.com',              -- ← Edit
    ARRAY['adp.com'],               -- ← Edit
    '#10B981', true
  ),
  -- Industry Bodies
  (
    'a0000000-0000-0000-0000-000000000001',
    'Industry', 'Industry Bodies', 'NSCM',
    'NASSCOM / HYSEA',               -- ← Edit
    'Membership Team',               -- ← Edit
    'membership@nasscom.in',         -- ← Edit
    ARRAY['nasscom.in', 'hysea.in'], -- ← Edit
    '#EC4899', true
  ),
  -- Insurance
  (
    'a0000000-0000-0000-0000-000000000001',
    'Insurance', 'Insurance', 'Ins',
    'New India Assurance',           -- ← Edit
    'Srinivas Rao',                  -- ← Edit
    'srinivas@nia.co.in',           -- ← Edit
    ARRAY['nia.co.in'],             -- ← Edit
    '#06B6D4', true
  ),
  -- Legal
  (
    'a0000000-0000-0000-0000-000000000001',
    'Legal', 'Legal', 'Law',
    'Trilegal',                      -- ← Edit
    'Arjun Mehta',                   -- ← Edit
    'arjun@trilegal.com',           -- ← Edit
    ARRAY['trilegal.com'],          -- ← Edit
    '#F97316', true
  ),
  -- Recruitment / RPO
  (
    'a0000000-0000-0000-0000-000000000001',
    'Recruit', 'Recruitment / RPO', 'RPO',
    'TeamLease',                     -- ← Edit
    'Nisha Gupta',                   -- ← Edit
    'nisha@teamlease.com',          -- ← Edit
    ARRAY['teamlease.com'],         -- ← Edit
    '#84CC16', true
  );


-- ============================================================
-- CREATE YOUR GCC HEAD PROFILE
-- ============================================================
-- Run this AFTER creating the user account in Supabase Auth.
-- Replace the values below with your actual details.
--
-- Step 1: Create the auth user via:
--   Dashboard → Authentication → Users → Add user
--   OR use the sign-up form in the app with email/password
--
-- Step 2: Copy the UUID from the auth user just created
--
-- Step 3: Uncomment and edit the INSERT below, then run it:
-- ============================================================

-- INSERT INTO users (id, gcc_id, name, email, role)
-- VALUES (
--   'PASTE-YOUR-AUTH-USER-UUID-HERE',  -- ← from Supabase Auth → Users
--   'a0000000-0000-0000-0000-000000000001',
--   'Your Name',                        -- ← your display name
--   'your@email.com',                   -- ← your login email
--   'gcc_head'
-- );


-- ============================================================
-- OPTIONAL: Add a second user (HR Head example)
-- ============================================================

-- INSERT INTO users (id, gcc_id, name, email, role)
-- VALUES (
--   'PASTE-HR-HEAD-AUTH-UUID-HERE',
--   'a0000000-0000-0000-0000-000000000001',
--   'HR Head Name',
--   'hrhead@yourcompany.com',
--   'hr_head'
-- );


-- ============================================================
-- OPTIONAL: Add a US Stakeholder
-- ============================================================

-- INSERT INTO users (id, gcc_id, name, email, role, digest_subscribed)
-- VALUES (
--   'PASTE-US-HEAD-AUTH-UUID-HERE',
--   'a0000000-0000-0000-0000-000000000001',
--   'US Stakeholder Name',
--   'stakeholder@usco.com',
--   'us_head',
--   true   -- will receive weekly digest emails (Sprint 4)
-- );
