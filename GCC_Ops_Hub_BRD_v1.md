# GCC OPS HUB
## Business Requirements & Technical Specification
**Version 1.0 · May 2026 · AiMaq / Criticalys · Confidential**

---

> **Product Purpose:** A visibility dashboard for GCC India heads and US stakeholders to track all external vendor activities — compliance filings, facilities, payroll, legal, insurance — in one clean view. Not a project management tool. A mirror that makes the invisible visible.

---

## TABLE OF CONTENTS
1. Product Overview
2. User Roles & Permissions
3. Vendor Configuration
4. Status Model
5. Feature Specifications — Phase 1 MVP
6. Email Intelligence — AI Parsing
7. Audit Trail Specification
8. Additional MVP Features
9. Data Model
10. Technical Stack
11. Design Guidelines
12. Build Sequence — 4 Sprints
13. Cowork Build Instructions

---

## 1. PRODUCT OVERVIEW

### 1.1 Name & Core Philosophy

**Product Name:** GCC Ops Hub  
**Tagline:** The mirror that makes the invisible visible.

GCC heads manage 6–10 external vendors whose updates live in inboxes and WhatsApp threads. US stakeholders get status over separate email chains. Dependencies between vendors are invisible until something breaks.

**GCC Ops Hub solves this by:**
- Capturing vendor activities automatically from email using AI — no manual entry
- Presenting everything in one clean dashboard organised by vendor
- Giving US stakeholders a summary view without overwhelming detail
- Tracking every change with an immutable audit trail for compliance purposes
- Surfacing dependency blocks before they cause compliance failures

> **NON-NEGOTIABLE RULE:** GCC Ops Hub is NOT a project management tool. It does not assign tasks, send reminders, or tell people what to do. Phase 1 has zero alert/notification features. It is a pure visibility layer. Complexity kills adoption. Every feature decision must pass this test: does this make the picture clearer, or does it add noise?

### 1.2 Business Model

| Model | Price | Notes |
|---|---|---|
| SaaS Annual | ₹3–8 lakh per GCC per year | Billed annually. Primary revenue. |
| Setup + Onboarding | ₹25,000 one-time | White-glove onboarding by Criticalys |
| Enterprise (5+ GCCs) | Custom pricing | For PE portfolio companies |

---

## 2. USER ROLES & PERMISSIONS

Four roles. Permissions enforced at every action point — in the frontend AND at database level via Supabase Row Level Security.

| Role | View All | Edit Activity | Edit Note | Delete | View Audit Log |
|---|---|---|---|---|---|
| GCC Head (India) | ✓ Full access | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes |
| HR Head (India) | ✓ Full access | ✓ Yes | ✓ Yes | ✗ No | ✗ No |
| US Head / Stakeholder | Summary only | ✗ No (read only) | ✗ No | ✗ No | ✗ No |
| Vendor (external) | Own tasks only | Status only | ✗ No | ✗ No | ✗ No |

**US Head View:** Sees overall compliance % per vendor, red flag count, dependency alerts, and a weekly auto-generated digest email. Does NOT see individual activity notes, vendor contact details, or the audit trail.

**Vendor View:** Each vendor logs in and sees ONLY their own activities. Cannot see any other vendor's data. Can update status and add progress notes on their own tasks only.

---

## 3. VENDOR CONFIGURATION

### 3.1 Default Vendors (8 pre-configured)

These 8 vendors are available on account setup. GCC Head can enable, disable, rename, or add custom vendors at any time. All vendor operations are GCC Head only.

| Code | Full Name | Typical Activities |
|---|---|---|
| CA | Chartered Accountant | GST returns (GSTR-1, GSTR-3B), TDS (Form 24Q/26Q), income tax, transfer pricing, RBI FLA return, audit coordination |
| CS | Company Secretary | ROC filings (MGT-7, DIR-3 KYC), board resolutions, statutory registers, address changes, share certificates |
| Bldg | Building / Facility | Lease management, maintenance SLAs, fire NOC, professional tax registration, shops & establishments license |
| Pay | Payroll | Monthly salary processing, PF/ESI challans, professional tax, Form 16, Full & Final settlements, ECR filings |
| NSCM | Industry Bodies | NASSCOM membership renewal, HYSEA annual levy, SEZ compliance, IT export certifications |
| Ins | Insurance | Group medical, D&O policy, workmen compensation, fire & burglary — renewals and endorsements |
| Law | Legal | DPDP compliance, employment contracts, IP assignments, POSH report, vendor agreements |
| RPO | Recruitment / RPO | Open positions, interview pipeline, offer letters, joining confirmations, BGV status |

### 3.2 Add / Remove Vendors

GCC Head can add unlimited vendors at any time via the Add Vendor button. Required fields: display name, firm name, contact name, contact email (used for auto-detection from email). GCC Head can also deactivate any vendor (hides from dashboard, data preserved). There is also one open custom slot available from setup.

### 3.3 Auto-Detection from Email

When an email arrives from an address not in the vendor list, a non-intrusive notification appears: "New sender: name@firm.com — Add as vendor?" GCC Head confirms with one click.

> **Firm rule:** The system NEVER adds a vendor or creates an activity without explicit GCC Head confirmation. AI proposes. Human confirms. Always.

---

## 4. STATUS MODEL

Five statuses. Every activity has exactly one status at any time.

| Status | Colour Hex | Meaning |
|---|---|---|
| Open | Grey #64748B | Task exists, not yet started. Default for all new activities. |
| In Process | Blue #3B82F6 | Vendor is actively working. Set manually or by AI on email signal. |
| Waiting | Amber #F59E0B | Blocked — depends on another party's action. Example: CA filing waiting for CS to complete address change. |
| Red Flag | Red #EF4444 | Overdue, escalated, or at serious risk. Auto-set when deadline passes. Can also be set manually. |
| Closed | Green #22C55E | Fully completed and confirmed. Set manually or by AI when email signals completion. |

> **Auto-Promotion Rule:** Any activity with status Open, In Process, or Waiting that passes its deadline is automatically promoted to Red Flag. This runs as a nightly scheduled job. No manual action needed.

---

## 5. FEATURE SPECIFICATIONS — PHASE 1 MVP

> **MVP Scope Rule:** Phase 1 builds exactly what is in this section — nothing more. Goal: working, beautiful, deployable product in 6–8 weeks. Everything else is Phase 2.

---

### 5.1 Screen 1 — Main Dashboard

Home screen. All users land here after login.

**Top Bar (fixed, always visible)**
- Left: GCC Ops Hub logo + company name + GCC city
- Centre: Red flag count badge (if >0) + Waiting count badge (if >0)
- Right: Current user role label + View toggle (Full View / Summary)

**Dependency Alert Banner (conditional)**
Appears ONLY when at least one activity is blocked by an incomplete dependency. Shows: which vendor is blocked, which vendor is causing the block, days until the blocked activity's deadline. Dismissible per session but reappears on next login if still unresolved.

**Summary Stats Row (4 tiles)**
- Total activities tracked (all vendors, all statuses)
- Active (Open + In Process + Waiting combined)
- Red Flags (tile highlighted red if count > 0)
- Due in 14 days (activities with deadline within 14 days, not Closed)

**Vendor Cards Grid**
- Responsive: 3 columns desktop, 2 tablet, 1 mobile
- Each card contains: coloured short-code badge (e.g. "CA"), full vendor name, firm name (smaller), progress bar (% of Closed activities), Done/Active/Flag/Total counts, % complete (top right)
- BLOCKED badge visible on card if any activity is in Waiting due to dependency
- Add Vendor card at end of grid (dashed border, + icon) — GCC Head only
- Clicking a card opens Vendor Detail (Screen 2)

**US Summary View (toggled)**
When US Head toggle is active: shows overall compliance %, vendor list rows with status indicators, red flag summary. No drill-down, no notes, no vendor contacts, no activity details.

---

### 5.2 Screen 2 — Vendor Detail

Opened by clicking a vendor card.

**Vendor Header Bar**
- Back arrow to return to Main Dashboard
- Vendor badge (coloured initials) + full name + firm name + contact email (GCC Head / HR Head only)
- Export button (↓ Export) — exports current view to CSV, date-stamped filename

**Filter Bar**
Horizontal row of pill buttons: All | Open | In Process | Waiting | Red Flag | Closed. Default: All. Immediate filter on click. Footer shows "Showing X of Y activities — Filter: [Status Name]" when filter is active.

**Role Notice (conditional)**
For US Head or Vendor: subtle banner reads "Read-only view — [Role] cannot edit activities."

**Activity List Rows**
Each row contains:
- Source icon: ✉ (email capture) | 📅 (regulatory calendar) | ✏ (manual entry)
- Activity title — if blocked by dependency, ⚠ icon precedes the title
- Deadline date
- Truncated note (greyed, max 40 characters)
- Status badge (coloured pill)
- Clicking a row opens Activity Detail panel alongside — does NOT navigate away from the list

**Add Activity (GCC Head and HR Head only)**
Row at bottom of list: "+ Add activity". Opens minimal inline form: Title (text), Deadline (date picker), Status (defaults to Open), Note (optional text). Source set to "manual". Save or Cancel.

---

### 5.3 Screen 3 — Activity Detail Panel

Opens alongside the activity list when an activity row is clicked. Both are visible simultaneously on desktop. Full-screen on mobile.

**Detail Header**
- Current status badge
- "DEPENDENCY BLOCKED" amber badge if applicable
- "View audit log" — very small, muted text link, bottom right of panel, visible to GCC Head only
- Close (✕) button

**Activity Information**
- Source + deadline line: e.g. "✉ Captured from email · 20 May"
- Activity title (large, prominent)

**Note Field**
Shows current note in a read-only box. GCC Head and HR Head see an "Edit" link beside the label. Clicking Edit converts to a textarea with Save and Cancel buttons. On Save, note is updated and an audit entry is automatically created. Only the current note is shown in the detail panel — full note history lives in the audit trail only.

**Status Selector**
Five buttons, one per status. Current status is visually highlighted (coloured background). For GCC Head and HR Head: clicking a different status immediately updates it and creates an audit entry. For US Head and Vendor: buttons are visible but non-clickable (greyed out).

**Audit Trail (GCC Head only)**
Accessed via small "View audit log" text link at bottom of the panel. Opens as an inline collapsible section — does NOT navigate away. Shows a reverse-chronological timeline of all changes to this activity. Each entry: timestamp, user name, action description, old value → new value. Immutable — no edit, no delete, no hide. GCC Head can export audit log for a specific activity as CSV.

---

## 6. EMAIL INTELLIGENCE — AI PARSING

This feature makes GCC Ops Hub effortless. Activities are captured from email automatically, without manual entry.

### 6.1 Setup

GCC Head connects their Gmail or Outlook account via OAuth during onboarding. One-time setup. System monitors the connected inbox continuously for emails from known vendor email domains.

> **Privacy:** System only reads emails from recognised vendor email addresses. Does not scan personal emails, internal company emails, or messages from unknown senders beyond noting the new address.

### 6.2 Processing Flow

1. Email arrives in GCC Head's connected inbox
2. System checks: is the sender's email domain in the vendor list?
3. **If YES (known vendor):** AI reads subject and body, extracts: activity description, deadline (if mentioned), status signal (e.g. "completed", "approved", "waiting for your response")
4. System checks if this matches an existing open activity for this vendor
5. **If match found:** Proposed update shown — "Activity updated: [title] → [new status]". GCC Head confirms with one click.
6. **If no match:** Proposed new activity shown — "New activity: [title], deadline [date]". GCC Head confirms or edits before saving.
7. **If NO (unknown sender):** Non-intrusive notification — "New sender: name@firm.com — Add as vendor?" GCC Head can confirm, skip, or ignore.

### 6.3 Real Example — DSC Approval (Live Use Case)

**Email from CA:** "Kindly approve use of your DSC for ROC annual filing. Please reply with approval."

→ System creates proposed activity: "DSC approval for ROC annual filing", Vendor: CA, Status: Open, Source: email.  
→ GCC Head confirms. Activity is live in dashboard.

**GCC Head replies in email:** "Approved."

→ System reads reply, detects approval signal, proposes: "Activity updated: DSC approval for ROC annual filing → In Process"  
→ GCC Head confirms with one click. Audit entry created: "Email auto-update: Open → In Process, by: Email capture, 12 May 09:41"

> **AI Accuracy Principle:** AI will not be 100% accurate on every email. AI always proposes. Human always confirms. Never auto-create or auto-update without showing the user first. Trust is built by transparency, not automation.

---

## 7. AUDIT TRAIL SPECIFICATION

The audit trail is a compliance feature, not a daily-use feature. It provides an immutable record of all changes for disputes, compliance audits, or legal requirements.

### 7.1 What is Captured (Automatically, Always)

- Status change: who changed, from which status, to which status, at what time
- Note edit: who edited, previous note text, new note text, at what time
- Activity created: by whom (manual / email system / calendar), at what time
- Activity deleted: by whom, at what time, activity title preserved in log

### 7.2 Audit Entry Fields

| Field | Description |
|---|---|
| timestamp | Exact date and time of change (IST). Immutable. |
| user_display | Snapshot of user name at time of change. If system: "System — Auto" or "Email capture" |
| user_role | Snapshot of role at time of change |
| action | "Created" / "Updated status" / "Edited note" / "Deleted" |
| field_changed | "status" / "note" / "title" / "deadline" |
| from_value | Previous value before change |
| to_value | New value after change |

### 7.3 Access & Display Rules

- Visible to GCC Head only
- Accessed via small "View audit log" text link at bottom of Activity Detail panel
- Presented as reverse-chronological timeline in a collapsible inline section (does not navigate away)
- Immutable — no edit, no delete, no hide capability at any level, for any role
- GCC Head can export audit log for a specific activity as CSV for legal/compliance use

---

## 8. ADDITIONAL MVP FEATURES

### 8.1 Indian Regulatory Calendar Auto-Generator

On account setup, GCC Head inputs: company type (Pvt Ltd / LLP / Branch Office / Subsidiary), state of registration, employee count band (1–50 / 51–100 / 100–500 / 500+), foreign subsidiary (yes/no), GST registered (yes/no).

System auto-generates all mandatory recurring activities for CA and CS vendors with correct deadlines pre-populated for the current financial year. Each activity is tagged source: "calendar" and appears immediately in the vendor's activity list.

**Regulatory items auto-generated for a typical Pvt Ltd foreign subsidiary in Telangana:**

*CA activities:* GSTR-1 (monthly), GSTR-3B (monthly), TDS return Q1/Q2/Q3/Q4 (Form 24Q), advance tax (4 instalments), RBI FLA return (July), income tax return, transfer pricing documentation

*CS activities:* Annual return MGT-7 (60 days after AGM), DIR-3 KYC (September 30), board meeting minutes (quarterly), statutory register updates (quarterly)

> **First-minute value:** The GCC head sees their entire compliance calendar populated immediately after onboarding — before they have manually entered a single activity. This creates instant, visible value and justifies the product fee in the first session.

### 8.2 CSV Export

Available from Vendor Detail via the Export button. Exports the currently visible activity list (respects the active filter). 

CSV columns: Activity title, Deadline, Status, Priority, Source, Note, Last updated date, Last updated by.

Filename format: `VendorName_FilterStatus_YYYY-MM-DD.csv`

Example: `CA_RedFlag_2026-05-12.csv`

### 8.3 Dependency Linking

When creating or editing an activity, GCC Head can mark it as "blocked by" another activity from any vendor. A searchable dropdown shows all non-Closed activities across all vendors.

Once linked:
- Blocked activity shows ⚠ icon in all list views
- Dependency alert banner appears on main dashboard
- Card for the blocked vendor shows "BLOCKED" badge

When the blocking activity is Closed, the dependency link is automatically cleared. The blocked activity's status does NOT change automatically — GCC Head updates it manually.

### 8.4 Weekly Digest Email (Auto-generated)

Every Friday at 8:00 AM IST, the system automatically sends a digest email to all users with the US Head role. Zero manual effort from GCC Head.

Digest contains:
- GCC name and reporting period (week ending)
- Overall compliance percentage
- Vendor-by-vendor one-line summary (e.g. "CA: 4/6 activities complete — 1 red flag")
- Total red flag count and which vendors they belong to
- Count of activities due in the next 7 days

GCC Head can preview the digest template and disable it from settings.

---

## 9. DATA MODEL

Six core tables. Designed for Phase 2 scalability — no schema changes required to add Phase 2 features. All tables include `created_at` and `updated_at` timestamps.

### 9.1 GCC Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | System-generated |
| name | String | Display name e.g. "TechCorp India — Hyderabad GCC" |
| company_name | String | Legal registered company name |
| city | String | City of operations |
| registration_state | String | State of incorporation (for regulatory calendar) |
| company_type | Enum | PvtLtd / LLP / BranchOffice / Subsidiary |
| employee_count_band | Enum | 1-50 / 51-100 / 100-500 / 500+ |
| foreign_subsidiary | Boolean | Triggers RBI/FEMA calendar items |
| gst_registered | Boolean | Triggers GST return calendar items |
| created_at | Timestamp | |

### 9.2 Vendor Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | |
| gcc_id | UUID FK → GCC | Parent GCC |
| category | Enum | CA / CS / Building / Payroll / Industry / Insurance / Legal / Recruit / Custom |
| display_name | String | Full name shown in UI |
| short_code | String (4 chars) | Badge text e.g. "CA", "Bldg" |
| firm_name | String | e.g. "Sharma & Associates" |
| contact_name | String | Primary contact person |
| email_domains | Array[String] | For auto-detection e.g. ["sharmaassoc.com"] |
| color_hex | String | UI card colour e.g. "#3B82F6" |
| is_active | Boolean | GCC Head can deactivate without deleting |
| auto_detected | Boolean | Was this vendor auto-detected from email? |

### 9.3 Activity Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | |
| vendor_id | UUID FK → Vendor | Which vendor this belongs to |
| title | String | Activity description e.g. "GSTR-3B April return" |
| deadline | Date | Due date |
| status | Enum | open / in_process / waiting / red_flag / closed |
| priority | Enum | high / medium / low — store now, surface in Phase 2 |
| note | Text | Current note (full note history is in AuditLog only) |
| source | Enum | email / calendar / manual |
| blocked_by_id | UUID FK → Activity (nullable) | Dependency link |
| is_recurring | Boolean | Regulatory calendar items are recurring |
| recurrence_rule | String (nullable) | e.g. "MONTHLY" — for Phase 2 expansion |
| created_by | UUID FK → User | For audit |
| updated_by | UUID FK → User | For audit |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### 9.4 AuditLog Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | |
| activity_id | UUID FK → Activity | Which activity was changed |
| user_display | String | Snapshot of user name at time of change |
| user_role | String | Snapshot of role at time of change |
| action | String | "Created" / "Updated status" / "Edited note" / "Deleted" |
| field_changed | String | "status" / "note" / "title" / "deadline" |
| from_value | Text | Previous value |
| to_value | Text | New value after change |
| timestamp | Timestamp | Exact time — IMMUTABLE. Never allow UPDATE or DELETE on this table. |

### 9.5 User Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | |
| gcc_id | UUID FK → GCC | Which GCC this user belongs to |
| name | String | Display name |
| email | String | Login email |
| role | Enum | gcc_head / hr_head / us_head / vendor |
| vendor_id | UUID FK → Vendor (nullable) | Set only if role is vendor |
| digest_subscribed | Boolean | Receives weekly digest (us_head role) |
| created_at | Timestamp | |

### 9.6 EmailCapture Table

| Field | Type | Description |
|---|---|---|
| id | UUID PK | |
| gcc_id | UUID FK → GCC | |
| from_address | String | Sender email address |
| email_subject | String | Subject line |
| received_at | Timestamp | When email was received |
| ai_extracted_title | String | Activity title extracted by AI |
| ai_extracted_deadline | Date (nullable) | Deadline if mentioned in email |
| ai_extracted_status | Enum (nullable) | Status signal from email content |
| confirmed | Boolean | Has GCC Head confirmed this capture? |
| linked_activity_id | UUID FK → Activity (nullable) | Set after GCC Head confirms |

---

## 10. TECHNICAL STACK

### 10.1 Stack Decisions

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React (pre-built) | UI already designed and tested. Do not rebuild in another framework. |
| Deployment | Vercel | Free tier, one-command deploy, custom domain support. |
| Backend / Database | Supabase (PostgreSQL) | Built-in auth, Row Level Security (maps perfectly to our 4-role model), real-time, REST API auto-generated. Free tier sufficient for Phase 1. |
| Authentication | Supabase Auth | Email/password + magic link. User role stored in User table. |
| Email Parsing | Supabase Edge Function + Claude API | Gmail/Outlook OAuth connects inbox. Edge Function calls claude-sonnet-4-20250514 to extract activity data from email content. |
| Email OAuth | Gmail API / Microsoft Graph API | GCC Head connects inbox once during onboarding. System then monitors passively. |
| Digest Email | Resend.com | Simple API. Free tier: 3,000 emails/month — sufficient for Phase 1. |
| Phase 1 Hosting Cost | ~₹0–2,000/month | Vercel free + Supabase free tier covers Phase 1 entirely. |

### 10.2 Supabase Row Level Security (Role Enforcement)

RLS enforces permissions at the DATABASE level — even if someone bypasses the UI, they cannot access data they are not permitted to see.

```
-- GCC Head and HR Head: full access to their GCC's data
CREATE POLICY "gcc_head_hr_head_access" ON activities
  FOR ALL USING (
    gcc_id = auth.jwt()->>'gcc_id'
    AND auth.jwt()->>'role' IN ('gcc_head', 'hr_head')
  );

-- GCC Head only: delete activities, view audit log
CREATE POLICY "gcc_head_delete" ON activities
  FOR DELETE USING (auth.jwt()->>'role' = 'gcc_head');

CREATE POLICY "gcc_head_audit" ON auditlog
  FOR SELECT USING (auth.jwt()->>'role' = 'gcc_head');

-- US Head: read-only, no notes field
CREATE POLICY "us_head_read" ON activities
  FOR SELECT USING (auth.jwt()->>'role' = 'us_head');
-- Note: Create a view for us_head that excludes the 'note' column

-- Vendor: own activities only
CREATE POLICY "vendor_own_activities" ON activities
  FOR SELECT USING (
    vendor_id = (auth.jwt()->>'vendor_id')::uuid
    AND auth.jwt()->>'role' = 'vendor'
  );
CREATE POLICY "vendor_update_status" ON activities
  FOR UPDATE USING (
    vendor_id = (auth.jwt()->>'vendor_id')::uuid
    AND auth.jwt()->>'role' = 'vendor'
  );
```

### 10.3 Phase 1 Build Checklist

1. Supabase project — schema from Section 9, RLS policies from Section 10.2
2. React frontend connected to Supabase via supabase-js client library
3. Authentication flow: login page → role detected from User table → correct view loaded
4. All CRUD operations: vendors, activities, users
5. Regulatory calendar generator: reads company profile → auto-creates activities with correct deadlines
6. Email OAuth: Gmail (Google Cloud Console OAuth app) or Outlook (Azure app registration)
7. Supabase Edge Function: email parsing using Claude claude-sonnet-4-20250514 model
8. Nightly cron job (Supabase scheduled function): auto-promote overdue activities to Red Flag
9. CSV export: client-side generation from filtered activity data
10. Weekly digest: Resend email template triggered by Supabase scheduled function every Friday 8AM IST

---

## 11. DESIGN GUIDELINES

The React prototype (gcc_ops_hub_v3.jsx) establishes the visual language. These rules must be maintained through all screens.

### 11.1 Core Design Principles

- **Dark theme only** — background #09090B, surface #0C0C0D, elevated #111113
- **Status colours are semantic** — never use green/red for anything other than the defined status colours
- **No modal dialogs** — all interactions happen inline or in side panels
- **No toast notifications in Phase 1** — changes are reflected immediately in the UI
- **Medium density** — rows need breathing room, do not pack elements tightly
- **Mobile responsive** — single column on mobile, full multi-column layout on desktop
- **Transition on interactive elements** — 0.1–0.15s ease for background and border changes

### 11.2 Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Background | #09090B | Page background |
| Surface | #0C0C0D | Top bar, headers, detail panels |
| Elevated | #111113 | Selected rows, active card states |
| Border subtle | #17171A | Row dividers between list items |
| Border strong | #27272A | Card borders, input borders |
| Text Primary | #F0F0F2 | Headings, titles, important content |
| Text Secondary | #A1A1AA | Labels, descriptions |
| Text Muted | #52525B | Meta info, dates, source indicators |
| Text Faint | #3F3F46 | Placeholders, empty states |
| Blue — In Process | #3B82F6 | Status colour ONLY |
| Green — Closed | #22C55E | Status colour ONLY |
| Amber — Waiting | #F59E0B | Status colour ONLY |
| Red — Red Flag | #EF4444 | Status colour ONLY |
| Grey — Open | #64748B | Status colour ONLY |

### 11.3 Vendor Card Colours

Each vendor has a pre-assigned card colour:

| Vendor | Hex |
|---|---|
| CA | #3B82F6 (Blue) |
| CS | #8B5CF6 (Purple) |
| Building | #F59E0B (Amber) |
| Payroll | #10B981 (Emerald) |
| Industry Bodies | #EC4899 (Pink) |
| Insurance | #06B6D4 (Cyan) |
| Legal | #F97316 (Orange) |
| Recruitment | #84CC16 (Lime) |
| Custom | #6B7280 (Grey) |

### 11.4 Component Patterns

- **Vendor cards:** 12px border radius, 1.5px border when selected (vendor colour), progress bar 3px height
- **Status badges:** 20px border radius pill, semi-transparent background in status colour, dot indicator
- **Activity rows:** transparent background default, subtle highlight on hover, coloured left border accent when selected
- **Filter buttons:** pill shape, transparent when inactive, status-coloured background when active
- **All interactive elements:** 0.1–0.15s transition on background, border, and colour changes

---

## 12. BUILD SEQUENCE — 4 SPRINTS

Total estimated duration: **6–8 weeks** to a working, deployable MVP ready for pilot clients.

| Sprint | Focus | What Gets Built | Output / Milestone |
|---|---|---|---|
| S1 — Wk 1–2 | Core Structure | Supabase project setup, schema, RLS policies. React auth flow with role detection. Vendor CRUD (8 default + custom). Activity CRUD. Status model. Dependency linking. Basic list view. | Working app where GCC Head can add vendors and manually create/update activities. No AI yet. Foundation is solid. |
| S2 — Wk 3–4 | Dashboard + Calendar | Main dashboard with vendor health cards. Summary stats row. Dependency alert banner. Indian regulatory calendar generator (company profile → auto-create activities). Role-based views (US summary / India full). Nightly cron for Red Flag auto-promotion. | Full dashboard live. Calendar auto-populates on setup. US Head summary view works correctly. |
| S3 — Wk 5–6 | Email Intelligence | Gmail/Outlook OAuth integration. Supabase Edge Function calling Claude API for email parsing. Vendor auto-detection from unknown senders. Activity confirmation UI (propose → confirm flow). EmailCapture table population. | Emails from CA and CS surface as activity suggestions in the dashboard. This is the product's wow moment. |
| S4 — Wk 7–8 | Export + Audit + Polish | CSV export with filter awareness. Weekly digest email via Resend. Audit trail UI (GCC Head only, collapsible inline). Vendor portal login (separate access for vendors). Bug fixes, edge cases, UI polish. | Complete Phase 1 product. Ready for first 5 pilot clients. |

### Post-Sprint 4: Pilot Strategy

Offer free 60-day access to 5 GCC heads from the KPMG GCC WhatsApp group. These are founding users. Their feedback shapes Phase 2 priorities. They become paid customers and testimonials. Do not wait for perfection — ship S4 and learn from real usage.

> **Phase 2 (after 10 paying clients):** Document AI (contract expiry extraction from PDFs), vendor performance scoring, multi-GCC portal (Criticalys manages multiple client GCCs), WhatsApp message parsing, predictive alerts ("your CA is historically 5 days late on this filing"), mobile app (iOS + Android).

---

## 13. COWORK BUILD INSTRUCTIONS

### 13.1 Files to Share with Cowork

Share all of the following together:
1. This document: `GCC_Ops_Hub_BRD_v1.md` — complete specification
2. `gcc_ops_hub_v3.jsx` — React prototype (most complete version, with filters, audit, role switching)
3. `gcc_ops_hub_v2.jsx` — earlier prototype showing US summary view

### 13.2 Cowork Prompt — Paste This Exactly

```
I am building a web application called GCC Ops Hub. I have attached the complete 
Business Requirements and Technical Specification document (GCC_Ops_Hub_BRD_v1.md) 
and two React prototype files (gcc_ops_hub_v3.jsx, gcc_ops_hub_v2.jsx).

GCC Ops Hub is a compliance and vendor activity visibility dashboard for India GCC 
heads and US stakeholders. It is NOT a project management tool — it is a pure 
visibility layer. The UI is already designed in the React prototypes.

Tech stack: React frontend (use the prototype as the visual foundation) + Supabase 
(PostgreSQL + auth + Row Level Security) + Vercel deployment. Email parsing via 
Gmail/Outlook OAuth + Supabase Edge Function calling Claude API 
(model: claude-sonnet-4-20250514).

Please read the BRD document fully before writing any code. Start with Sprint 1 as 
defined in Section 12: set up the Supabase project with the full database schema 
from Section 9, configure Row Level Security per Section 10.2 for all four user 
roles, connect the React frontend to Supabase using supabase-js, implement 
authentication with role detection, and build full CRUD for Vendors and Activities 
including the dependency linking feature.

Follow the design guidelines in Section 11 exactly — dark theme, specific colour 
values, status colour semantics, no modals, no toasts in Phase 1.

Ask me to clarify anything ambiguous before writing code.
```

### 13.3 Sprint-by-Sprint Cowork Instructions

Focus each Cowork session on one sprint to keep context sharp:

- **Sprint 1:** Share Sections 2 (Roles), 3 (Vendors), 4 (Status), 9 (Data Model), 10 (Stack), 11 (Design)
- **Sprint 2:** Share Sections 5.1 (Dashboard), 5.2 (Vendor Detail), 8.1 (Calendar), 8.4 (Digest)
- **Sprint 3:** Share Section 6 (Email Intelligence), Section 3.3 (Auto-detection)
- **Sprint 4:** Share Sections 5.3 (Activity Detail), 7 (Audit Trail), 8.2 (CSV Export)

### 13.4 Key Things to Verify After Each Sprint

**After Sprint 1:**
- [ ] All 4 roles have correct access (test with each role)
- [ ] Dependency linking works — blocking activity appears in alert banner
- [ ] Status auto-promotes to Red Flag when deadline passes

**After Sprint 2:**
- [ ] Regulatory calendar generates correct activities for a sample company profile
- [ ] US Head sees summary view only — no activity notes visible
- [ ] Progress bars calculate correctly

**After Sprint 3:**
- [ ] Email from known vendor address triggers proposed activity
- [ ] Unknown sender triggers "Add as vendor?" prompt
- [ ] AI does NOT auto-create activities — all require confirmation

**After Sprint 4:**
- [ ] Audit log captures every status change and note edit automatically
- [ ] CSV export respects active filter
- [ ] Vendor login sees ONLY their own activities

---

*GCC Ops Hub — Business Requirements & Technical Specification v1.0*  
*AiMaq | Criticalys Info Management | Hyderabad | Confidential | May 2026*
