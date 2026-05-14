
import { useState } from "react";

const STATUS = {
  open:       { label: "Open",       color: "#94a3b8", bg: "#1e293b", dot: "#64748b" },
  in_process: { label: "In Process", color: "#60a5fa", bg: "#1e3a5f", dot: "#3b82f6" },
  waiting:    { label: "Waiting",    color: "#fbbf24", bg: "#2d2208", dot: "#f59e0b" },
  red_flag:   { label: "Red Flag",   color: "#f87171", bg: "#2d0a0a", dot: "#ef4444" },
  closed:     { label: "Closed",     color: "#4ade80", bg: "#052e16", dot: "#22c55e" },
};

const VENDOR_COLORS = {
  ca:       "#3b82f6", cs:       "#8b5cf6",
  building: "#f59e0b", payroll:  "#10b981",
  industry: "#ec4899", insurance:"#06b6d4",
  legal:    "#f97316", recruit:  "#84cc16",
  custom:   "#6b7280",
};

const vendors = [
  {
    id: "ca", name: "Chartered Accountant", short: "CA",
    firm: "Sharma & Associates", contact: "rajesh@sharmaassoc.com",
    activities: [
      { id: 1, title: "DSC approval — ROC annual filing", date: "12 May", status: "in_process", source: "email", note: "CA requested via email 12 May. Maq replied 'Approved' same day." },
      { id: 2, title: "GSTR-3B April return", date: "20 May", status: "waiting", source: "email", note: "Awaiting GST portal credentials from HR." },
      { id: 3, title: "TDS return Q4 Form 24Q", date: "31 May", status: "in_process", source: "email", note: "Certificates being compiled." },
      { id: 4, title: "GSTR-1 April filing", date: "10 May", status: "closed", source: "email", note: "Filed and acknowledged 10 May." },
      { id: 5, title: "Advance tax Q1 estimate", date: "15 Jun", status: "open", source: "calendar", note: "" },
    ]
  },
  {
    id: "cs", name: "Company Secretary", short: "CS",
    firm: "Legal Compliance Partners", contact: "priya@lcp.co.in",
    activities: [
      { id: 6, title: "Change of address — Ahmedabad to Hyderabad", date: "25 May", status: "in_process", source: "email", note: "⚠ CA blocked until this is done.", blocked: true },
      { id: 7, title: "Statutory registers update Q1", date: "30 Apr", status: "red_flag", source: "email", note: "12 days overdue. No update received." },
      { id: 8, title: "Board resolution — new bank mandate", date: "18 May", status: "open", source: "email", note: "Pending director signatures." },
      { id: 9, title: "Annual return MGT-7", date: "29 Nov", status: "open", source: "calendar", note: "" },
    ]
  },
  {
    id: "building", name: "Building / Facility", short: "Bldg",
    firm: "Smartworks Raidurg", contact: "ops@smartworks.in",
    activities: [
      { id: 10, title: "Monthly maintenance SLA review", date: "15 May", status: "open", source: "email", note: "" },
      { id: 11, title: "Fire NOC renewal", date: "1 Jul", status: "open", source: "calendar", note: "" },
      { id: 12, title: "Lease renewal discussion", date: "31 Aug", status: "open", source: "manual", note: "Start negotiation by June." },
      { id: 13, title: "AC breakdown — Floor 3 cabin", date: "10 May", status: "closed", source: "email", note: "Resolved same day." },
    ]
  },
  {
    id: "payroll", name: "Payroll", short: "Pay",
    firm: "ADP India Pvt Ltd", contact: "kavitha@adp.com",
    activities: [
      { id: 14, title: "April salary processing", date: "29 Apr", status: "closed", source: "email", note: "Processed and confirmed." },
      { id: 15, title: "May salary processing", date: "31 May", status: "open", source: "calendar", note: "LOP list due from HR by 25 May." },
      { id: 16, title: "Form 16 issue FY25-26", date: "15 Jun", status: "in_process", source: "email", note: "TDS certificates in progress." },
    ]
  },
  {
    id: "industry", name: "Industry Bodies", short: "NSCM",
    firm: "NASSCOM / HYSEA", contact: "membership@nasscom.in",
    activities: [
      { id: 17, title: "NASSCOM membership renewal FY26-27", date: "31 Mar", status: "closed", source: "email", note: "Renewed and confirmed." },
      { id: 18, title: "HYSEA annual levy", date: "30 Jun", status: "open", source: "calendar", note: "" },
    ]
  },
  {
    id: "insurance", name: "Insurance", short: "Ins",
    firm: "New India Assurance", contact: "srinivas@nia.co.in",
    activities: [
      { id: 19, title: "Group medical insurance renewal", date: "1 Jul", status: "open", source: "email", note: "Quote received. Awaiting comparison." },
      { id: 20, title: "D&O policy renewal", date: "15 Aug", status: "open", source: "calendar", note: "" },
      { id: 21, title: "Workmen compensation — annual review", date: "30 Jun", status: "in_process", source: "email", note: "Employee list shared." },
    ]
  },
  {
    id: "legal", name: "Legal", short: "Law",
    firm: "Trilegal", contact: "arjun@trilegal.com",
    activities: [
      { id: 22, title: "DPDP Act compliance assessment", date: "30 Jun", status: "in_process", source: "email", note: "Gap analysis 60% done." },
      { id: 23, title: "Employment contract template update", date: "31 May", status: "open", source: "manual", note: "New labour code changes." },
    ]
  },
  {
    id: "recruit", name: "Recruitment / RPO", short: "RPO",
    firm: "TeamLease", contact: "nisha@teamlease.com",
    activities: [
      { id: 24, title: "Senior Engineer — 3 positions open", date: "31 May", status: "in_process", source: "email", note: "8 profiles shared. Interviews scheduled." },
      { id: 25, title: "Offer letter — Priya Kaur accepted", date: "12 May", status: "closed", source: "email", note: "Joining June 2." },
    ]
  },
];

function dot(status) {
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: STATUS[status].dot, flexShrink: 0 }} />;
}

function StatusBadge({ status, small }) {
  const s = STATUS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "1px 7px" : "3px 9px",
      borderRadius: 20, background: s.bg,
      color: s.color, fontSize: small ? 10 : 11, fontWeight: 500,
      border: `0.5px solid ${s.dot}44`, whiteSpace: "nowrap"
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function VendorCard({ vendor, onClick, isSelected }) {
  const c = VENDOR_COLORS[vendor.id] || VENDOR_COLORS.custom;
  const total = vendor.activities.length;
  const closed = vendor.activities.filter(a => a.status === "closed").length;
  const redFlag = vendor.activities.filter(a => a.status === "red_flag").length;
  const waiting = vendor.activities.filter(a => a.status === "waiting").length;
  const pct = total ? Math.round((closed / total) * 100) : 0;
  const hasIssue = redFlag > 0 || waiting > 0;

  return (
    <div onClick={onClick} style={{
      background: isSelected ? "#111113" : "#0c0c0d",
      border: isSelected ? `1.5px solid ${c}` : `1px solid ${hasIssue ? "#3a1f1f" : "#1c1c20"}`,
      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
      transition: "all 0.15s ease",
      position: "relative"
    }}>
      {(redFlag > 0) && (
        <div style={{ position: "absolute", top: 10, right: 10, background: "#450a0a", color: "#fca5a5", fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10 }}>
          {redFlag} FLAG
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: c + "18", border: `1px solid ${c}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: c, fontSize: 11, fontWeight: 700, flexShrink: 0
        }}>{vendor.short}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 13, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {vendor.name}
          </div>
          <div style={{ color: "#52525b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {vendor.firm}
          </div>
        </div>
      </div>
      <div style={{ background: "#17171a", borderRadius: 5, height: 3, marginBottom: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: 5, transition: "width 0.4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { v: closed, color: "#4ade80", label: "done" },
            { v: total - closed, color: "#a1a1aa", label: "open" },
          ].map(x => (
            <div key={x.label} style={{ textAlign: "center" }}>
              <div style={{ color: x.color, fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{x.v}</div>
              <div style={{ color: "#3f3f46", fontSize: 10, marginTop: 2 }}>{x.label}</div>
            </div>
          ))}
          {redFlag > 0 && <div style={{ textAlign: "center" }}>
            <div style={{ color: "#f87171", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{redFlag}</div>
            <div style={{ color: "#3f3f46", fontSize: 10, marginTop: 2 }}>flag</div>
          </div>}
        </div>
        <div style={{ color: "#52525b", fontSize: 11 }}>{pct}%</div>
      </div>
    </div>
  );
}

function ActivityItem({ activity, vendorColor, onClick, isSelected }) {
  const s = STATUS[activity.status];
  const sourceIcon = activity.source === "email" ? "✉" : activity.source === "calendar" ? "📅" : "✏";
  return (
    <div onClick={onClick} style={{
      padding: "12px 16px",
      background: isSelected ? "#111113" : "transparent",
      borderBottom: "1px solid #17171a",
      cursor: "pointer",
      transition: "background 0.1s",
      borderLeft: isSelected ? `2px solid ${vendorColor}` : "2px solid transparent"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            {activity.blocked && <span style={{ fontSize: 12 }}>⚠️</span>}
            <span style={{ color: "#e4e4e7", fontSize: 13, fontWeight: activity.status === "red_flag" ? 600 : 400 }}>
              {activity.title}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#3f3f46", fontSize: 11 }}>{sourceIcon} {activity.date}</span>
            {activity.note && <span style={{ color: "#3f3f46", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>· {activity.note}</span>}
          </div>
        </div>
        <StatusBadge status={activity.status} small />
      </div>
    </div>
  );
}

function ActivityDetail({ activity, vendorColor, onStatusChange }) {
  const s = STATUS[activity.status];
  return (
    <div style={{ padding: "20px 20px 16px", flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#71717a", fontSize: 11, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {activity.source === "email" ? "✉ Captured from email" : activity.source === "calendar" ? "📅 Regulatory calendar" : "✏ Added manually"}
        </div>
        <h3 style={{ color: "#f0f0f2", fontSize: 16, fontWeight: 600, lineHeight: 1.4, marginBottom: 12 }}>
          {activity.blocked && "⚠️ "}{activity.title}
        </h3>
        <StatusBadge status={activity.status} />
      </div>

      {activity.note && (
        <div style={{
          background: "#111113", border: "1px solid #1c1c20", borderRadius: 8,
          padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#a1a1aa", lineHeight: 1.6
        }}>
          {activity.note}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#3f3f46", fontSize: 10, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Update status</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(STATUS).map(([key, val]) => (
            <button key={key} onClick={() => onStatusChange(activity.id, key)} style={{
              background: activity.status === key ? val.bg : "transparent",
              border: `1px solid ${activity.status === key ? val.dot : "#27272a"}`,
              color: activity.status === key ? val.color : "#52525b",
              padding: "4px 10px", borderRadius: 16, cursor: "pointer",
              fontSize: 11, fontWeight: activity.status === key ? 600 : 400,
              transition: "all 0.1s"
            }}>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ color: "#3f3f46", fontSize: 11, borderTop: "1px solid #17171a", paddingTop: 12 }}>
        Date: {activity.date} · Source: {activity.source}
      </div>
    </div>
  );
}

export default function GCCOpsHubV2() {
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [view, setView] = useState("india"); // india | us
  const [activities, setActivities] = useState(
    vendors.reduce((acc, v) => ({ ...acc, [v.id]: v.activities }), {})
  );

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const vendorActivities = selectedVendorId ? activities[selectedVendorId] : [];
  const selectedActivity = vendorActivities.find(a => a.id === selectedActivityId);
  const color = selectedVendorId ? (VENDOR_COLORS[selectedVendorId] || VENDOR_COLORS.custom) : "#6b7280";

  const totalRedFlags = Object.values(activities).flat().filter(a => a.status === "red_flag").length;
  const totalOpen = Object.values(activities).flat().filter(a => a.status !== "closed").length;
  const totalAll = Object.values(activities).flat().length;

  function handleStatusChange(activityId, newStatus) {
    setActivities(prev => ({
      ...prev,
      [selectedVendorId]: prev[selectedVendorId].map(a =>
        a.id === activityId ? { ...a, status: newStatus } : a
      )
    }));
  }

  return (
    <div style={{
      background: "#09090b", height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", color: "#e4e4e7",
      overflow: "hidden"
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid #17171a",
        background: "#0c0c0d", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>G</span>
            </div>
            <span style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 14 }}>GCC Ops Hub</span>
          </div>
          <span style={{ color: "#27272a" }}>|</span>
          <span style={{ color: "#52525b", fontSize: 12 }}>TechCorp India · Hyderabad</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {totalRedFlags > 0 && (
            <div style={{ background: "#450a0a", color: "#f87171", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, marginRight: 8 }}>
              {totalRedFlags} Red Flag{totalRedFlags > 1 ? "s" : ""}
            </div>
          )}
          <div style={{ display: "flex", background: "#17171a", borderRadius: 8, padding: 3, gap: 2 }}>
            {[["india", "🇮🇳 Full View"], ["us", "🇺🇸 Summary"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "#27272a" : "transparent",
                border: "none", color: view === v ? "#f0f0f2" : "#52525b",
                padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: view === v ? 500 : 400, transition: "all 0.1s"
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {view === "us" ? (
        /* US SUMMARY VIEW */
        <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
          <div style={{ color: "#52525b", fontSize: 12, marginBottom: 20 }}>Summary view · Last updated 12 May 2026, 09:41</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total activities tracked", val: totalAll, color: "#a1a1aa" },
              { label: "Open / in progress", val: totalOpen, color: "#60a5fa" },
              { label: "Needs attention", val: totalRedFlags, color: totalRedFlags > 0 ? "#f87171" : "#4ade80", alert: true },
            ].map(c => (
              <div key={c.label} style={{ background: "#0f0f10", border: "1px solid #1c1c20", borderRadius: 12, padding: 18 }}>
                <div style={{ color: c.color, fontWeight: 700, fontSize: 32, lineHeight: 1 }}>{c.val}</div>
                <div style={{ color: "#52525b", fontSize: 12, marginTop: 8 }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vendors.map(v => {
              const acts = activities[v.id];
              const flags = acts.filter(a => a.status === "red_flag");
              const waiting = acts.filter(a => a.status === "waiting");
              const done = acts.filter(a => a.status === "closed").length;
              const pct = Math.round((done / acts.length) * 100);
              return (
                <div key={v.id} style={{ background: "#0f0f10", border: `1px solid ${flags.length ? "#3a1f1f" : "#1c1c20"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: VENDOR_COLORS[v.id] + "18", display: "flex", alignItems: "center", justifyContent: "center", color: VENDOR_COLORS[v.id], fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{v.short}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#d4d4d8", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{v.name}</div>
                    <div style={{ background: "#17171a", borderRadius: 3, height: 3, width: "100%" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: VENDOR_COLORS[v.id], borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {flags.length > 0 && <StatusBadge status="red_flag" small />}
                    {waiting.length > 0 && <StatusBadge status="waiting" small />}
                    {flags.length === 0 && waiting.length === 0 && <span style={{ color: "#4ade80", fontSize: 11 }}>✓ On track</span>}
                  </div>
                  <div style={{ color: "#52525b", fontSize: 12, flexShrink: 0 }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* INDIA HEAD FULL VIEW */
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Vendor list */}
          <div style={{
            width: selectedVendorId ? 260 : "100%",
            flexShrink: 0,
            borderRight: selectedVendorId ? "1px solid #17171a" : "none",
            overflow: "auto", padding: selectedVendorId ? 12 : 20,
            transition: "all 0.2s"
          }}>
            {!selectedVendorId && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#52525b", fontSize: 11, marginBottom: 4 }}>12 May 2026 · {totalAll} activities tracked</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { s: "red_flag", count: Object.values(activities).flat().filter(a => a.status === "red_flag").length },
                    { s: "waiting", count: Object.values(activities).flat().filter(a => a.status === "waiting").length },
                    { s: "in_process", count: Object.values(activities).flat().filter(a => a.status === "in_process").length },
                  ].filter(x => x.count > 0).map(x => (
                    <StatusBadge key={x.s} status={x.s} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: selectedVendorId ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {vendors.map(v => (
                <VendorCard
                  key={v.id}
                  vendor={{ ...v, activities: activities[v.id] }}
                  isSelected={selectedVendorId === v.id}
                  onClick={() => {
                    if (selectedVendorId === v.id) { setSelectedVendorId(null); setSelectedActivityId(null); }
                    else { setSelectedVendorId(v.id); setSelectedActivityId(null); }
                  }}
                />
              ))}
              <div onClick={() => {}} style={{
                background: "transparent", border: "1px dashed #27272a",
                borderRadius: 14, padding: "16px 18px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#3f3f46", fontSize: 13, gap: 6, minHeight: 80
              }}>
                <span style={{ fontSize: 18 }}>+</span> Add vendor
              </div>
            </div>
          </div>

          {/* Activity list */}
          {selectedVendorId && (
            <div style={{
              width: selectedActivityId ? 260 : "calc(100% - 260px)",
              borderRight: selectedActivityId ? "1px solid #17171a" : "none",
              overflow: "auto", display: "flex", flexDirection: "column"
            }}>
              <div style={{
                padding: "14px 16px", borderBottom: "1px solid #17171a",
                display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
                background: "#0c0c0d", position: "sticky", top: 0
              }}>
                <button onClick={() => { setSelectedVendorId(null); setSelectedActivityId(null); }} style={{
                  background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 16, padding: "0 4px 0 0"
                }}>←</button>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: 10, fontWeight: 700 }}>{selectedVendor.short}</div>
                <div>
                  <div style={{ color: "#f0f0f2", fontWeight: 600, fontSize: 14 }}>{selectedVendor.name}</div>
                  <div style={{ color: "#52525b", fontSize: 11 }}>{selectedVendor.firm}</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {vendorActivities.map(activity => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    vendorColor={color}
                    isSelected={selectedActivityId === activity.id}
                    onClick={() => setSelectedActivityId(selectedActivityId === activity.id ? null : activity.id)}
                  />
                ))}
                <div style={{
                  padding: "12px 16px", color: "#3f3f46", fontSize: 12,
                  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                  borderTop: "1px solid #17171a"
                }}>
                  <span style={{ fontSize: 16 }}>+</span> Add activity
                </div>
              </div>
            </div>
          )}

          {/* Activity detail */}
          {selectedActivityId && selectedActivity && (
            <div style={{ flex: 1, overflow: "auto", background: "#0c0c0d", display: "flex", flexDirection: "column" }}>
              <div style={{
                padding: "14px 16px", borderBottom: "1px solid #17171a",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0, position: "sticky", top: 0, background: "#0c0c0d"
              }}>
                <span style={{ color: "#52525b", fontSize: 11 }}>Activity detail</span>
                <button onClick={() => setSelectedActivityId(null)} style={{
                  background: "#17171a", border: "1px solid #27272a", color: "#71717a",
                  borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12
                }}>✕ Close</button>
              </div>
              <ActivityDetail
                activity={selectedActivity}
                vendorColor={color}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
