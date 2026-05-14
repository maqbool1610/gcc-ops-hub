
import { useState } from "react";

// ─── DATA MODEL ───────────────────────────────────────────────
const STATUS = {
  open:       { label: "Open",       color: "#94a3b8", bg: "#1e293b", dot: "#64748b" },
  in_process: { label: "In Process", color: "#60a5fa", bg: "#1e3a5f", dot: "#3b82f6" },
  waiting:    { label: "Waiting",    color: "#fbbf24", bg: "#2d2208", dot: "#f59e0b" },
  red_flag:   { label: "Red Flag",   color: "#f87171", bg: "#2d0a0a", dot: "#ef4444" },
  closed:     { label: "Closed",     color: "#4ade80", bg: "#052e16", dot: "#22c55e" },
};

const ROLES = {
  gcc_head: { label: "GCC Head", canEdit: true,  canDelete: true,  flag: "🇮🇳" },
  hr_head:  { label: "HR Head",  canEdit: true,  canDelete: false, flag: "🇮🇳" },
  us_head:  { label: "US Head",  canEdit: false, canDelete: false, flag: "🇺🇸" },
  vendor:   { label: "Vendor",   canEdit: false, canDelete: false, flag: "🏢" },
};

const VENDOR_COLORS = {
  ca:"#3b82f6", cs:"#8b5cf6", building:"#f59e0b",
  payroll:"#10b981", industry:"#ec4899",
  insurance:"#06b6d4", legal:"#f97316", recruit:"#84cc16", custom:"#6b7280",
};

// Audit log entry factory
function auditEntry(user, role, action, field, from, to) {
  return { ts: new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }), user, role, action, field, from, to };
}

const initialVendors = [
  { id:"ca",       short:"CA",   name:"Chartered Accountant", firm:"Sharma & Associates",    email:"rajesh@sharmaassoc.com" },
  { id:"cs",       short:"CS",   name:"Company Secretary",    firm:"Legal Compliance Partners", email:"priya@lcp.co.in" },
  { id:"building", short:"Bldg", name:"Building / Facility",  firm:"Smartworks Raidurg",     email:"ops@smartworks.in" },
  { id:"payroll",  short:"Pay",  name:"Payroll",              firm:"ADP India Pvt Ltd",      email:"kavitha@adp.com" },
  { id:"industry", short:"NSCM", name:"Industry Bodies",      firm:"NASSCOM / HYSEA",        email:"membership@nasscom.in" },
  { id:"insurance",short:"Ins",  name:"Insurance",            firm:"New India Assurance",    email:"srinivas@nia.co.in" },
  { id:"legal",    short:"Law",  name:"Legal",                firm:"Trilegal",               email:"arjun@trilegal.com" },
  { id:"recruit",  short:"RPO",  name:"Recruitment / RPO",    firm:"TeamLease",              email:"nisha@teamlease.com" },
];

const initialActivities = {
  ca: [
    { id:1,  title:"DSC approval — ROC annual filing",   deadline:"12 May", status:"in_process", source:"email",
      note:"CA requested via email 12 May. Maq replied 'Approved' same day.",
      audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("CA Email","email","Auto-updated","status","open","in_process")] },
    { id:2,  title:"GSTR-3B April return",               deadline:"20 May", status:"waiting",    source:"email",
      note:"Awaiting GST portal credentials from HR.",
      audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","waiting")] },
    { id:3,  title:"TDS return Q4 Form 24Q",             deadline:"31 May", status:"in_process", source:"email",
      note:"", audit:[auditEntry("System","auto","Created","status",null,"in_process")] },
    { id:4,  title:"GSTR-1 April filing",                deadline:"10 May", status:"closed",     source:"email",
      note:"Filed and acknowledged 10 May.",
      audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("CA Email","email","Auto-updated","status","open","closed")] },
    { id:5,  title:"Advance tax Q1 estimate",            deadline:"15 Jun", status:"open",       source:"calendar",
      note:"", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
  ],
  cs: [
    { id:6,  title:"Change of address — Ahm to Hyd",    deadline:"25 May", status:"in_process", source:"email", blocked:true,
      note:"⚠ CA (RBI FLA) blocked until this is complete.",
      audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","in_process")] },
    { id:7,  title:"Statutory registers update Q1",     deadline:"30 Apr", status:"red_flag",   source:"email",
      note:"12 days overdue.",
      audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("System","auto","Auto-promoted — past deadline","status","open","red_flag")] },
    { id:8,  title:"Board resolution — new bank mandate",deadline:"18 May", status:"open",      source:"email",
      note:"Pending director signatures.", audit:[auditEntry("System","auto","Created","status",null,"open")] },
    { id:9,  title:"Annual return MGT-7",               deadline:"29 Nov", status:"open",       source:"calendar",
      note:"", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
  ],
  building: [
    { id:10, title:"Monthly maintenance SLA review",    deadline:"15 May", status:"open",       source:"email",    note:"", audit:[auditEntry("System","auto","Created","status",null,"open")] },
    { id:11, title:"Fire NOC renewal",                  deadline:"1 Jul",  status:"open",       source:"calendar", note:"", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
    { id:12, title:"Lease renewal discussion",          deadline:"31 Aug", status:"open",       source:"manual",   note:"Start negotiation by June.", audit:[auditEntry("Maq","gcc_head","Created manually","status",null,"open")] },
    { id:13, title:"AC breakdown — Floor 3 cabin",      deadline:"10 May", status:"closed",     source:"email",    note:"Resolved same day.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","closed")] },
  ],
  payroll: [
    { id:14, title:"April salary processing",           deadline:"29 Apr", status:"closed",     source:"email",    note:"Processed and confirmed.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("ADP Email","email","Auto-updated","status","open","closed")] },
    { id:15, title:"May salary processing",             deadline:"31 May", status:"open",       source:"calendar", note:"LOP list due from HR by 25 May.", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
    { id:16, title:"Form 16 issue FY25-26",             deadline:"15 Jun", status:"in_process", source:"email",    note:"TDS certificates in progress.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("ADP Email","email","Auto-updated","status","open","in_process")] },
  ],
  industry: [
    { id:17, title:"NASSCOM membership renewal FY26-27",deadline:"31 Mar", status:"closed",     source:"email",    note:"Renewed and confirmed.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","closed")] },
    { id:18, title:"HYSEA annual levy",                 deadline:"30 Jun", status:"open",       source:"calendar", note:"", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
  ],
  insurance: [
    { id:19, title:"Group medical insurance renewal",   deadline:"1 Jul",  status:"open",       source:"email",    note:"Quote received. Awaiting comparison.", audit:[auditEntry("System","auto","Created","status",null,"open")] },
    { id:20, title:"D&O policy renewal",               deadline:"15 Aug", status:"open",       source:"calendar", note:"", audit:[auditEntry("System","auto","Created from regulatory calendar","status",null,"open")] },
    { id:21, title:"Workmen compensation review",      deadline:"30 Jun", status:"in_process", source:"email",    note:"Employee list shared.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","in_process")] },
  ],
  legal: [
    { id:22, title:"DPDP Act compliance assessment",   deadline:"30 Jun", status:"in_process", source:"email",    note:"Gap analysis 60% done.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("Maq","gcc_head","Updated","status","open","in_process")] },
    { id:23, title:"Employment contract template update",deadline:"31 May",status:"open",      source:"manual",   note:"New labour code changes.", audit:[auditEntry("Maq","gcc_head","Created manually","status",null,"open")] },
  ],
  recruit: [
    { id:24, title:"Senior Engineer — 3 open positions",deadline:"31 May", status:"in_process",source:"email",    note:"8 profiles shared. Interviews scheduled.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("ATS Email","email","Auto-updated","status","open","in_process")] },
    { id:25, title:"Offer letter — Priya Kaur accepted", deadline:"12 May", status:"closed",   source:"email",    note:"Joining June 2.", audit:[auditEntry("System","auto","Created","status",null,"open"), auditEntry("ATS Email","email","Auto-updated","status","open","closed")] },
  ],
};

// ─── COMPONENTS ───────────────────────────────────────────────
function StatusBadge({ status, small }) {
  const s = STATUS[status];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding: small ? "1px 7px" : "3px 9px", borderRadius:20,
      background:s.bg, color:s.color, fontSize: small ? 10 : 11,
      fontWeight:500, border:`0.5px solid ${s.dot}44`, whiteSpace:"nowrap"
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.dot, flexShrink:0 }}/>
      {s.label}
    </span>
  );
}

function AuditRow({ entry }) {
  const roleColor = { gcc_head:"#3b82f6", hr_head:"#10b981", us_head:"#8b5cf6", email:"#f59e0b", auto:"#6b7280" };
  return (
    <div style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #17171a", alignItems:"flex-start" }}>
      <div style={{ flexShrink:0, paddingTop:2 }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background: roleColor[entry.role] || "#6b7280" }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2, flexWrap:"wrap" }}>
          <span style={{ color:"#e4e4e7", fontSize:12, fontWeight:500 }}>{entry.user}</span>
          <span style={{ color:"#3f3f46", fontSize:11 }}>{entry.action}</span>
          {entry.from && <span style={{ color:"#52525b", fontSize:11 }}>
            <span style={{ color:STATUS[entry.from]?.color || "#94a3b8" }}>{STATUS[entry.from]?.label || entry.from}</span>
            {" → "}
            <span style={{ color:STATUS[entry.to]?.color || "#94a3b8" }}>{STATUS[entry.to]?.label || entry.to}</span>
          </span>}
        </div>
        <div style={{ color:"#3f3f46", fontSize:10 }}>{entry.ts}</div>
      </div>
    </div>
  );
}

function FilterBar({ activeFilter, onChange }) {
  const filters = [["all","All"], ...Object.entries(STATUS).map(([k,v]) => [k, v.label])];
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", padding:"10px 14px", borderBottom:"1px solid #17171a", background:"#0a0a0c" }}>
      {filters.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          background: activeFilter === k ? (k === "all" ? "#27272a" : STATUS[k]?.bg || "#27272a") : "transparent",
          border: `1px solid ${activeFilter === k ? (STATUS[k]?.dot || "#3f3f46") : "#1c1c20"}`,
          color: activeFilter === k ? (k === "all" ? "#e4e4e7" : STATUS[k]?.color || "#e4e4e7") : "#52525b",
          padding:"3px 10px", borderRadius:16, cursor:"pointer",
          fontSize:11, fontWeight: activeFilter === k ? 500 : 400, transition:"all 0.1s"
        }}>{l}</button>
      ))}
    </div>
  );
}

function exportCSV(activities, vendorName, filter) {
  const rows = activities.filter(a => filter === "all" || a.status === filter);
  const header = "Title,Deadline,Status,Source,Note";
  const data = rows.map(a => `"${a.title}","${a.deadline}","${STATUS[a.status].label}","${a.source}","${a.note}"`);
  const csv = [header, ...data].join("\n");
  const blob = new Blob([csv], { type:"text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${vendorName}_${filter}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function GCCOpsHubV3() {
  const [role, setRole]         = useState("gcc_head");
  const [selectedVid, setVid]   = useState(null);
  const [selectedAid, setAid]   = useState(null);
  const [filter, setFilter]     = useState("all");
  const [view, setView]         = useState("main");
  const [acts, setActs]         = useState(initialActivities);
  const [showAudit, setAudit]   = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [noteVal, setNoteVal]   = useState("");

  const canEdit = ROLES[role]?.canEdit;
  const vendor = initialVendors.find(v => v.id === selectedVid);
  const vColor = VENDOR_COLORS[selectedVid] || "#6b7280";
  const vendorActs = selectedVid ? acts[selectedVid] : [];
  const filteredActs = vendorActs.filter(a => filter === "all" || a.status === filter);
  const selAct = vendorActs.find(a => a.id === selectedAid);

  function changeStatus(vid, aid, newStatus) {
    if (!canEdit) return;
    setActs(prev => ({
      ...prev,
      [vid]: prev[vid].map(a => {
        if (a.id !== aid) return a;
        const entry = auditEntry(ROLES[role].label, role, "Updated", "status", a.status, newStatus);
        return { ...a, status: newStatus, audit: [...(a.audit||[]), entry] };
      })
    }));
  }

  function saveNote(vid, aid) {
    setActs(prev => ({
      ...prev,
      [vid]: prev[vid].map(a => {
        if (a.id !== aid) return a;
        const entry = auditEntry(ROLES[role].label, role, "Edited note", "note", a.note, noteVal);
        return { ...a, note: noteVal, audit: [...(a.audit||[]), entry] };
      })
    }));
    setEditNote(null);
  }

  const allActs = Object.values(acts).flat();
  const totalFlags = allActs.filter(a => a.status === "red_flag").length;
  const totalWaiting = allActs.filter(a => a.status === "waiting").length;

  // ── render
  return (
    <div style={{ background:"#09090b", height:"100vh", display:"flex", flexDirection:"column", fontFamily:"'DM Sans','Inter',system-ui,sans-serif", color:"#e4e4e7", overflow:"hidden" }}>

      {/* TOP BAR */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 18px", borderBottom:"1px solid #17171a", background:"#0c0c0d", flexShrink:0, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontSize:13, fontWeight:700 }}>G</span>
          </div>
          <span style={{ color:"#f0f0f2", fontWeight:600, fontSize:14 }}>GCC Ops Hub</span>
          <span style={{ color:"#27272a" }}>|</span>
          <span style={{ color:"#52525b", fontSize:12 }}>TechCorp India · Hyderabad</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {totalFlags > 0 && <div style={{ background:"#450a0a", color:"#f87171", fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{totalFlags} Red Flag{totalFlags>1?"s":""}</div>}
          {totalWaiting > 0 && <div style={{ background:"#2d2208", color:"#fbbf24", fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{totalWaiting} Waiting</div>}

          {/* Role switcher */}
          <div style={{ display:"flex", background:"#17171a", borderRadius:8, padding:3, gap:2 }}>
            {Object.entries(ROLES).map(([k,r]) => (
              <button key={k} onClick={() => setRole(k)} style={{
                background: role===k ? "#27272a" : "transparent",
                border:"none", color: role===k ? "#f0f0f2" : "#52525b",
                padding:"3px 10px", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight: role===k ? 500 : 400
              }}>{r.flag} {r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN BODY */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── VENDOR GRID (left / full when nothing selected) */}
        <div style={{
          width: selectedVid ? 240 : "100%", flexShrink:0,
          borderRight: selectedVid ? "1px solid #17171a" : "none",
          overflow:"auto", padding: selectedVid ? "12px 10px" : "20px",
          transition:"width 0.15s"
        }}>
          {!selectedVid && (
            <div style={{ marginBottom:14 }}>
              <div style={{ color:"#52525b", fontSize:11, marginBottom:10 }}>
                {allActs.length} activities · {allActs.filter(a=>a.status!=="closed").length} active · 12 May 2026
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns: selectedVid ? "1fr" : "repeat(auto-fill,minmax(190px,1fr))", gap:10 }}>
            {initialVendors.map(v => {
              const va = acts[v.id] || [];
              const done = va.filter(a=>a.status==="closed").length;
              const flags = va.filter(a=>a.status==="red_flag").length;
              const wait = va.filter(a=>a.status==="waiting").length;
              const pct = va.length ? Math.round(done/va.length*100) : 0;
              const c = VENDOR_COLORS[v.id];
              const sel = selectedVid===v.id;
              return (
                <div key={v.id} onClick={() => { setVid(sel?null:v.id); setAid(null); setFilter("all"); }}
                  style={{
                    background: sel ? "#111113" : "#0c0c0d",
                    border: sel ? `1.5px solid ${c}` : `1px solid ${flags>0?"#3a1f1f":"#1c1c20"}`,
                    borderRadius:12, padding:"13px 14px", cursor:"pointer", transition:"all 0.12s"
                  }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
                    <div style={{ width:32,height:32,borderRadius:8, background:c+"18", border:`1px solid ${c}33`, display:"flex", alignItems:"center", justifyContent:"center", color:c, fontSize:10, fontWeight:700, flexShrink:0 }}>{v.short}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:"#f0f0f2", fontWeight:600, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div>
                      <div style={{ color:"#3f3f46", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.firm}</div>
                    </div>
                  </div>
                  <div style={{ background:"#17171a", borderRadius:3, height:3, marginBottom:9, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:3 }}/>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ color:"#4ade80", fontSize:13, fontWeight:600 }}>{done}</span><span style={{ color:"#3f3f46", fontSize:10 }}>done</span>
                      <span style={{ color:"#a1a1aa", fontSize:13, fontWeight:600 }}>{va.length-done}</span><span style={{ color:"#3f3f46", fontSize:10 }}>open</span>
                      {flags>0 && <><span style={{ color:"#f87171", fontSize:13, fontWeight:600 }}>{flags}</span><span style={{ color:"#3f3f46", fontSize:10 }}>🚩</span></>}
                    </div>
                    <span style={{ color:"#3f3f46", fontSize:11 }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
            {/* Add vendor */}
            <div style={{ background:"transparent", border:"1px dashed #27272a", borderRadius:12, padding:"13px 14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#3f3f46", fontSize:12, gap:6, minHeight:90 }}>
              <span style={{ fontSize:18 }}>+</span> Add vendor
            </div>
          </div>
        </div>

        {/* ── ACTIVITY LIST */}
        {selectedVid && (
          <div style={{ width: selectedAid ? 260 : "calc(100% - 240px)", borderRight: selectedAid ? "1px solid #17171a" : "none", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Vendor header */}
            <div style={{ padding:"12px 14px", borderBottom:"1px solid #17171a", background:"#0c0c0d", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <button onClick={() => { setVid(null); setAid(null); }} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", fontSize:16 }}>←</button>
              <div style={{ width:26,height:26,borderRadius:7, background:vColor+"18", display:"flex", alignItems:"center", justifyContent:"center", color:vColor, fontSize:10, fontWeight:700 }}>{vendor.short}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:"#f0f0f2", fontWeight:600, fontSize:13 }}>{vendor.name}</div>
                <div style={{ color:"#3f3f46", fontSize:11 }}>{vendor.firm}</div>
              </div>
              {/* Export */}
              <button onClick={() => exportCSV(vendorActs, vendor.name, filter)} style={{ background:"#17171a", border:"1px solid #27272a", color:"#71717a", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", gap:5 }}>
                <span>↓</span> Export
              </button>
            </div>

            {/* Filter bar */}
            <FilterBar activeFilter={filter} onChange={setFilter} />

            {/* Role notice */}
            {!canEdit && (
              <div style={{ background:"#1a1a1e", padding:"6px 14px", borderBottom:"1px solid #17171a", color:"#52525b", fontSize:11 }}>
                👁 Read-only · {ROLES[role].label} cannot edit activities
              </div>
            )}

            {/* Activity rows */}
            <div style={{ flex:1, overflow:"auto" }}>
              {filteredActs.length === 0
                ? <div style={{ padding:24, color:"#3f3f46", fontSize:13, textAlign:"center" }}>No activities for this filter.</div>
                : filteredActs.map(a => {
                  const s = STATUS[a.status];
                  const sel = selectedAid === a.id;
                  return (
                    <div key={a.id} onClick={() => setAid(sel?null:a.id)} style={{
                      padding:"11px 14px", borderBottom:"1px solid #17171a", cursor:"pointer",
                      background: sel ? "#111113" : "transparent",
                      borderLeft: sel ? `2px solid ${vColor}` : "2px solid transparent",
                      transition:"background 0.1s"
                    }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ color:"#e4e4e7", fontSize:13, marginBottom:3, display:"flex", alignItems:"center", gap:5 }}>
                            {a.blocked && <span style={{ fontSize:12 }}>⚠️</span>}
                            {a.title}
                          </div>
                          <div style={{ color:"#3f3f46", fontSize:11, display:"flex", gap:8 }}>
                            <span>{a.source === "email" ? "✉" : a.source === "calendar" ? "📅" : "✏"} {a.deadline}</span>
                            {a.note && <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:180 }}>· {a.note}</span>}
                          </div>
                        </div>
                        <StatusBadge status={a.status} small />
                      </div>
                    </div>
                  );
                })
              }
              {/* Add activity */}
              {canEdit && (
                <div style={{ padding:"11px 14px", color:"#3f3f46", fontSize:12, display:"flex", alignItems:"center", gap:6, cursor:"pointer", borderTop:"1px solid #17171a" }}>
                  <span style={{ fontSize:16 }}>+</span> Add activity
                </div>
              )}
            </div>

            {/* Filter summary */}
            {filter !== "all" && (
              <div style={{ padding:"8px 14px", borderTop:"1px solid #17171a", background:"#0a0a0c", color:"#52525b", fontSize:11 }}>
                Showing {filteredActs.length} of {vendorActs.length} activities · Filter: {STATUS[filter]?.label}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY DETAIL + AUDIT */}
        {selectedAid && selAct && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#0c0c0d" }}>
            {/* Detail header */}
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #17171a", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"#0c0c0d" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <StatusBadge status={selAct.status} />
                {selAct.blocked && <span style={{ background:"#2d2208", color:"#fbbf24", fontSize:10, padding:"2px 8px", borderRadius:10 }}>⚠ DEPENDENCY BLOCKED</span>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => setAudit(!showAudit)} style={{
                  background: showAudit ? "#1e3a5f" : "#17171a",
                  border: `1px solid ${showAudit ? "#3b82f6" : "#27272a"}`,
                  color: showAudit ? "#60a5fa" : "#71717a",
                  borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:11
                }}>🕓 Audit trail</button>
                <button onClick={() => setAid(null)} style={{ background:"#17171a", border:"1px solid #27272a", color:"#71717a", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:11 }}>✕</button>
              </div>
            </div>

            <div style={{ flex:1, overflow:"auto", padding:"18px 18px 12px" }}>
              <div style={{ color:"#52525b", fontSize:11, marginBottom:6 }}>
                {selAct.source === "email" ? "✉ Captured from email" : selAct.source === "calendar" ? "📅 Regulatory calendar" : "✏ Added manually"}
                {" · "}{selAct.deadline}
              </div>
              <h3 style={{ color:"#f0f0f2", fontSize:16, fontWeight:600, lineHeight:1.4, marginBottom:14 }}>
                {selAct.title}
              </h3>

              {/* Note */}
              <div style={{ marginBottom:16 }}>
                <div style={{ color:"#3f3f46", fontSize:10, fontWeight:500, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span>Note</span>
                  {canEdit && editNote !== selAct.id && <button onClick={() => { setEditNote(selAct.id); setNoteVal(selAct.note||""); }} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", fontSize:11 }}>Edit</button>}
                </div>
                {editNote === selAct.id ? (
                  <div>
                    <textarea value={noteVal} onChange={e => setNoteVal(e.target.value)} style={{ width:"100%", background:"#17171a", border:"1px solid #3f3f46", color:"#e4e4e7", borderRadius:8, padding:"8px 10px", fontSize:13, resize:"vertical", minHeight:60, outline:"none" }}/>
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <button onClick={() => saveNote(selectedVid, selAct.id)} style={{ background:"#1e3a5f", border:"1px solid #3b82f6", color:"#60a5fa", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:11 }}>Save</button>
                      <button onClick={() => setEditNote(null)} style={{ background:"none", border:"1px solid #27272a", color:"#52525b", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:11 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background:"#111113", border:"1px solid #1c1c20", borderRadius:8, padding:"9px 12px", fontSize:13, color: selAct.note ? "#a1a1aa" : "#3f3f46", minHeight:40, lineHeight:1.6 }}>
                    {selAct.note || "No note added."}
                  </div>
                )}
              </div>

              {/* Status update */}
              <div style={{ marginBottom:16 }}>
                <div style={{ color:"#3f3f46", fontSize:10, fontWeight:500, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  {canEdit ? "Update status" : "Status (read-only)"}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Object.entries(STATUS).map(([k,v]) => (
                    <button key={k} onClick={() => canEdit && changeStatus(selectedVid, selAct.id, k)} style={{
                      background: selAct.status===k ? v.bg : "transparent",
                      border: `1px solid ${selAct.status===k ? v.dot : "#27272a"}`,
                      color: selAct.status===k ? v.color : "#52525b",
                      padding:"4px 11px", borderRadius:16, cursor: canEdit ? "pointer" : "default",
                      fontSize:11, fontWeight: selAct.status===k ? 600 : 400,
                      opacity: !canEdit && selAct.status!==k ? 0.4 : 1
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>

              {/* Audit trail */}
              {showAudit && (
                <div style={{ marginTop:8 }}>
                  <div style={{ color:"#3f3f46", fontSize:10, fontWeight:500, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>Audit trail — who changed what</div>
                  <div style={{ background:"#111113", border:"1px solid #1c1c20", borderRadius:10, overflow:"hidden" }}>
                    <div style={{ padding:"0 12px" }}>
                      {(selAct.audit||[]).map((e,i) => <AuditRow key={i} entry={e} />)}
                    </div>
                    {(!selAct.audit || selAct.audit.length === 0) && (
                      <div style={{ padding:14, color:"#3f3f46", fontSize:12 }}>No changes recorded yet.</div>
                    )}
                  </div>
                  <div style={{ color:"#3f3f46", fontSize:10, marginTop:6 }}>All changes are captured automatically. Cannot be edited or deleted.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: #09090b; } ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 2px; }`}</style>
    </div>
  );
}
