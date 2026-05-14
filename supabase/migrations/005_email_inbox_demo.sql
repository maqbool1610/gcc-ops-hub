-- 005_email_inbox_demo.sql — dummy email groups for UI preview
-- Run after 004_email_inbox.sql
-- To remove later: DELETE FROM email_activity_groups WHERE source_gmail_ids && ARRAY['demo-ca-gst-001'];

INSERT INTO email_activity_groups (gcc_id, vendor_id, category, urgency, suggested_deadline, updates, source_gmail_ids, status) VALUES

-- CA: GST Filing
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='CA' LIMIT 1),
 'GST Filing', 'high', '2026-05-20',
 '[{"gmail_id":"demo-ca-gst-001","summary":"Q4 GST return (Jan–Mar) filing deadline is 20th May — GSTR-3B and GSTR-1 both pending. Portal credentials updated, please confirm.","received_at":"2026-05-08T09:14:00Z","from_name":"Rajesh Sharma","from_email":"rajesh@sharmaassoc.com","subject":"GST Filing — Q4 FY25-26 — Action Required"},{"gmail_id":"demo-ca-gst-002","summary":"Reminder: GSTR-1 data reconciliation needs your sign-off on 3 B2B invoices flagged as mismatched with GSTN portal records.","received_at":"2026-05-11T11:30:00Z","from_name":"Rajesh Sharma","from_email":"rajesh@sharmaassoc.com","subject":"Re: GST Filing — invoice mismatch — urgent"}]',
 ARRAY['demo-ca-gst-001','demo-ca-gst-002'], 'pending'),

-- CA: TDS Return
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='CA' LIMIT 1),
 'TDS Return', 'low', NULL,
 '[{"gmail_id":"demo-ca-tds-001","summary":"Q4 TDS return (Form 24Q) filed successfully. Challan BSR code and acknowledgement attached for your records.","received_at":"2026-05-05T16:00:00Z","from_name":"Rajesh Sharma","from_email":"rajesh@sharmaassoc.com","subject":"TDS Return Q4 Filed — Acknowledgement Attached"}]',
 ARRAY['demo-ca-tds-001'], 'pending'),

-- CS: Annual Return Filing
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='CS' LIMIT 1),
 'Annual Return Filing', 'high', '2026-06-30',
 '[{"gmail_id":"demo-cs-mgr-001","summary":"Annual return (MGT-7A) due 30th June. Director DIN verification required from you — 2 directors added this year.","received_at":"2026-05-09T10:00:00Z","from_name":"Priya Nair","from_email":"priya@lcp.co.in","subject":"Annual Return MGT-7A — Director DIN Required"},{"gmail_id":"demo-cs-mgr-002","summary":"Reminder: Form DIR-3 KYC for all directors must be completed before June 30. 2 directors yet to update on MCA portal.","received_at":"2026-05-12T14:20:00Z","from_name":"Priya Nair","from_email":"priya@lcp.co.in","subject":"Director KYC (DIR-3) — action before MGT-7A"}]',
 ARRAY['demo-cs-mgr-001','demo-cs-mgr-002'], 'pending'),

-- CS: Board Meeting Minutes
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='CS' LIMIT 1),
 'Board Meeting Minutes', 'medium', '2026-05-25',
 '[{"gmail_id":"demo-cs-board-001","summary":"Q1 board meeting minutes (April sitting) drafted. Please review and return signed copy by 25th May for ROC filing.","received_at":"2026-05-10T09:30:00Z","from_name":"Priya Nair","from_email":"priya@lcp.co.in","subject":"Board Minutes Q1 — Review & Sign"}]',
 ARRAY['demo-cs-board-001'], 'pending'),

-- Building: Office Lease Renewal
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Bldg' LIMIT 1),
 'Office Lease Renewal', 'critical', '2026-07-31',
 '[{"gmail_id":"demo-bldg-lease-001","summary":"Lease renewal notice for Unit 401, Raidurg. Current lease expires 31st July. Landlord proposing 12% rent escalation — counter-offer window closes 31st May.","received_at":"2026-05-02T08:00:00Z","from_name":"Ops Team","from_email":"ops@smartworks.in","subject":"Lease Renewal Notice — Unit 401 Raidurg"},{"gmail_id":"demo-bldg-lease-002","summary":"Follow-up: landlord needs confirmation on renewal intent by Friday. Escalation reduced to 9% if confirmed before 15th May.","received_at":"2026-05-12T10:15:00Z","from_name":"Ops Team","from_email":"ops@smartworks.in","subject":"Re: Lease Renewal — Confirmation Deadline"}]',
 ARRAY['demo-bldg-lease-001','demo-bldg-lease-002'], 'pending'),

-- Building: Facility Maintenance
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Bldg' LIMIT 1),
 'Facility Maintenance', 'high', '2026-05-16',
 '[{"gmail_id":"demo-bldg-hvac-001","summary":"Quarterly HVAC servicing scheduled 16th May. Server room cooling unit flagged — compressor at 62% efficiency, recommend replacement before monsoon.","received_at":"2026-05-11T07:45:00Z","from_name":"Ops Team","from_email":"ops@smartworks.in","subject":"HVAC Servicing 16-May — Server Room Flag"}]',
 ARRAY['demo-bldg-hvac-001'], 'pending'),

-- Payroll: Payroll Processing
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Pay' LIMIT 1),
 'Payroll Processing', 'high', '2026-05-22',
 '[{"gmail_id":"demo-pay-payroll-001","summary":"May payroll inputs required by 22nd May — share final headcount, variable pay, and LOP adjustments. Disbursement set for 28th May.","received_at":"2026-05-10T09:00:00Z","from_name":"Kavitha Reddy","from_email":"kavitha@adp.com","subject":"May Payroll Inputs Due 22-May"},{"gmail_id":"demo-pay-payroll-002","summary":"3 new joiners not yet on payroll system — share employee codes and bank details before cutoff.","received_at":"2026-05-12T16:30:00Z","from_name":"Kavitha Reddy","from_email":"kavitha@adp.com","subject":"Re: May Payroll — New Joiner Details Missing"}]',
 ARRAY['demo-pay-payroll-001','demo-pay-payroll-002'], 'pending'),

-- Payroll: PF Compliance
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Pay' LIMIT 1),
 'PF Compliance', 'low', NULL,
 '[{"gmail_id":"demo-pay-pf-001","summary":"April PF contribution filed and challan paid — ECR acknowledgement attached. Passbook update may take 7–10 working days on EPFO portal.","received_at":"2026-05-07T15:00:00Z","from_name":"Kavitha Reddy","from_email":"kavitha@adp.com","subject":"PF April Filed — ECR Acknowledgement"}]',
 ARRAY['demo-pay-pf-001'], 'pending'),

-- Industry: Membership Renewal
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='NSCM' LIMIT 1),
 'Membership Renewal', 'high', '2026-05-15',
 '[{"gmail_id":"demo-nscm-mem-001","summary":"NASSCOM annual membership renewal invoice ₹2.4L attached. Early bird 5% discount if payment reaches by 15th May.","received_at":"2026-05-04T11:00:00Z","from_name":"Membership Team","from_email":"membership@nasscom.in","subject":"NASSCOM Membership Renewal FY26-27 — Early Bird"}]',
 ARRAY['demo-nscm-mem-001'], 'pending'),

-- Industry: Event
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='NSCM' LIMIT 1),
 'Industry Event', 'medium', '2026-05-30',
 '[{"gmail_id":"demo-nscm-event-001","summary":"HYSEA GCC Leaders Summit — 18th June. Early registration deadline 30th May. Speaker slots open for GCC Heads on ''India Talent Strategy 2026'' panel.","received_at":"2026-05-06T10:30:00Z","from_name":"Events Team","from_email":"events@hysea.in","subject":"HYSEA GCC Summit 2026 — Speaker Slot Invitation"}]',
 ARRAY['demo-nscm-event-001'], 'pending'),

-- Insurance: Health Insurance Renewal
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Ins' LIMIT 1),
 'Health Insurance Renewal', 'high', '2026-07-01',
 '[{"gmail_id":"demo-ins-ghi-001","summary":"Group health insurance (Policy 40010031) renews 1st July. Revised premium ₹18.6L for 95 employees — up 11%. Endorsement for 12 new joiners pending.","received_at":"2026-05-08T14:00:00Z","from_name":"Srinivas Rao","from_email":"srinivas@nia.co.in","subject":"GHI Renewal Notice — Policy 40010031"},{"gmail_id":"demo-ins-ghi-002","summary":"Employee data sheet for endorsements (new joiners + exits since Jan) must reach us by 20th May to process mid-term additions.","received_at":"2026-05-13T09:00:00Z","from_name":"Srinivas Rao","from_email":"srinivas@nia.co.in","subject":"Re: GHI — Employee Endorsement Data Needed"}]',
 ARRAY['demo-ins-ghi-001','demo-ins-ghi-002'], 'pending'),

-- Insurance: WC Policy
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Ins' LIMIT 1),
 'WC Policy Renewal', 'medium', '2026-06-15',
 '[{"gmail_id":"demo-ins-wc-001","summary":"Workmen Compensation policy renewal due June 15. Salary certificate from HR required for premium calculation.","received_at":"2026-05-06T12:00:00Z","from_name":"Srinivas Rao","from_email":"srinivas@nia.co.in","subject":"WC Policy Renewal — Salary Certificate Required"}]',
 ARRAY['demo-ins-wc-001'], 'pending'),

-- Legal: Contract Review
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Law' LIMIT 1),
 'Contract Review', 'high', '2026-05-20',
 '[{"gmail_id":"demo-law-contract-001","summary":"Employment contracts for 3 senior hires reviewed. 2 clauses flagged: IP assignment scope too broad; non-compete territory needs limiting to India only.","received_at":"2026-05-09T17:00:00Z","from_name":"Arjun Mehta","from_email":"arjun@trilegal.com","subject":"Contract Review — 3 Senior Hires — Clauses Flagged"}]',
 ARRAY['demo-law-contract-001'], 'pending'),

-- Legal: PE Risk
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='Law' LIMIT 1),
 'PE Risk Assessment', 'medium', NULL,
 '[{"gmail_id":"demo-law-pe-001","summary":"Annual PE risk assessment report ready. 2 process changes recommended to maintain non-PE status under DTAA.","received_at":"2026-05-07T11:00:00Z","from_name":"Arjun Mehta","from_email":"arjun@trilegal.com","subject":"PE Risk Assessment FY26 — Report Ready"},{"gmail_id":"demo-law-pe-002","summary":"US parent billing model change (cost-plus to fixed fee) may increase PE risk — recommend a call with your CFO before implementing.","received_at":"2026-05-12T15:00:00Z","from_name":"Arjun Mehta","from_email":"arjun@trilegal.com","subject":"Re: PE Risk — Billing Model Change Flagged"}]',
 ARRAY['demo-law-pe-001','demo-law-pe-002'], 'pending'),

-- RPO: Open Positions
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='RPO' LIMIT 1),
 'Open Positions Update', 'high', '2026-05-18',
 '[{"gmail_id":"demo-rpo-pipeline-001","summary":"12 positions open, 4 offers pending acceptance (expiry 18th May). 2 candidates have not responded in 5 days — please nudge.","received_at":"2026-05-11T08:00:00Z","from_name":"Nisha Gupta","from_email":"nisha@teamlease.com","subject":"Hiring Pipeline Update — Week of 11 May"},{"gmail_id":"demo-rpo-pipeline-002","summary":"Senior Data Engineer offer declined — took competing offer at 18% premium. 3 screened CVs ready for immediate review.","received_at":"2026-05-12T17:30:00Z","from_name":"Nisha Gupta","from_email":"nisha@teamlease.com","subject":"Re: Offer Declined — Sr. Data Engineer"}]',
 ARRAY['demo-rpo-pipeline-001','demo-rpo-pipeline-002'], 'pending'),

-- RPO: BGV
('a0000000-0000-0000-0000-000000000001',
 (SELECT id FROM vendors WHERE gcc_id='a0000000-0000-0000-0000-000000000001' AND short_code='RPO' LIMIT 1),
 'Background Verification', 'high', NULL,
 '[{"gmail_id":"demo-rpo-bgv-001","summary":"Q1 BGV summary: 28 completed, 3 pending. One case has employment history discrepancy (2020–2022 gap) — recommend holding offer pending clarification.","received_at":"2026-05-08T10:00:00Z","from_name":"Nisha Gupta","from_email":"nisha@teamlease.com","subject":"Q1 BGV Summary — Adverse Finding"}]',
 ARRAY['demo-rpo-bgv-001'], 'pending');
