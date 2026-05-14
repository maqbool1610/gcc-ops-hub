import { useState } from 'react'
import { VENDOR_COLORS } from '../lib/constants'

// ── Design tokens (match Dashboard navy theme) ────────────────────────────────
const C = {
  bg:       '#0a0c15',
  surface:  '#10131e',
  surface2: '#161a28',
  surface3: '#1c2235',
  border:   '#1c2238',
  border2:  '#222a42',
  accent:   '#4f80ef',
  text1:    '#edf0f8',
  text2:    '#8891a8',
  text3:    '#3d4560',
}

const URGENCY = {
  critical: { label: 'Critical', color: '#f87171', bg: '#2a0808', border: '#5c1a1a' },
  high:     { label: 'High',     color: '#fb923c', bg: '#1e1008', border: '#5c2a10' },
  medium:   { label: 'Medium',   color: '#fbbf24', bg: '#1e1508', border: '#4a3810' },
  low:      { label: 'Low',      color: '#8891a8', bg: '#161a28', border: '#1c2238' },
}

// ─────────────────────────────────────────────────────────────────────────────
// EmailInbox
// Props: groups, loading, syncing, vendors, pendingCount,
//        onConfirm, onDismiss, onAssignVendor, onSync
// ─────────────────────────────────────────────────────────────────────────────

export default function EmailInbox({
  groups = [],
  loading,
  syncing,
  vendors = [],
  pendingCount,
  onConfirm,
  onDismiss,
  onAssignVendor,
  onSync,
}) {
  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
      background:    C.bg,
    }}>
      {/* Header */}
      <div style={{
        padding:        '14px 18px',
        borderBottom:   `1px solid ${C.border}`,
        background:     `linear-gradient(180deg, #0f1220 0%, ${C.surface} 100%)`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: C.text1, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
              Email Inbox
            </span>
            {pendingCount > 0 && (
              <span style={{
                background: C.accent, color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 20,
              }}>
                {pendingCount}
              </span>
            )}
          </div>
          <div style={{ color: C.text3, fontSize: 11, marginTop: 2 }}>
            Emails parsed by AI · Review and confirm
          </div>
        </div>

        <button
          onClick={onSync}
          disabled={syncing}
          style={{
            background:   syncing ? C.surface3 : C.surface2,
            border:       `1px solid ${C.border2}`,
            color:        syncing ? C.text3 : C.text2,
            borderRadius: 8,
            padding:      '7px 14px',
            cursor:       syncing ? 'default' : 'pointer',
            fontSize:     12,
            fontFamily:   'inherit',
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            transition:   'all 0.12s',
          }}
        >
          <span style={{
            display:   'inline-block',
            animation: syncing ? 'spin 1s linear infinite' : 'none',
            fontSize:  13,
          }}>⟳</span>
          {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>

        {loading ? (
          <div style={{ color: C.text3, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            Loading inbox…
          </div>
        ) : groups.length === 0 ? (
          <EmptyInbox onSync={onSync} syncing={syncing} />
        ) : (
          <>
            <div style={{ color: C.text2, fontSize: 12, marginBottom: 14 }}>
              {groups.length} topic{groups.length !== 1 ? 's' : ''} awaiting review
            </div>
            {groups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                vendors={vendors}
                onConfirm={onConfirm}
                onDismiss={onDismiss}
                onAssignVendor={onAssignVendor}
              />
            ))}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .inbox-action-btn:hover { opacity: 0.85; }
        .dismiss-btn:hover { border-color: #3d4560 !important; color: #8891a8 !important; }
        .group-card { transition: box-shadow 0.15s ease; }
        .group-card:hover { box-shadow: 0 4px 24px #00000060; }
      `}</style>
    </div>
  )
}

// ── GroupCard — one card per category/topic ───────────────────────────────────

function GroupCard({ group, vendors, onConfirm, onDismiss, onAssignVendor }) {
  const [expanded,     setExpanded]     = useState(true)
  const [confirming,   setConfirming]   = useState(false)
  const [title,        setTitle]        = useState(group.category)
  const [deadline,     setDeadline]     = useState(group.suggested_deadline || '')
  const [priority,     setPriority]     = useState('medium')
  const [saving,       setSaving]       = useState(false)
  const [assigningVdr, setAssigningVdr] = useState(false)

  const urgency = URGENCY[group.urgency] || URGENCY.medium
  const vendor  = group.vendor
  const vColor  = vendor
    ? (vendor.color_hex || VENDOR_COLORS[vendor.category] || '#6b7280')
    : '#3d4560'

  const updates = [...(group.updates || [])]
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))

  const latestUpdate = updates[0]

  async function handleConfirm() {
    setSaving(true)
    await onConfirm(group, { title, deadline: deadline || null, priority })
    setSaving(false)
    setConfirming(false)
  }

  return (
    <div className="group-card" style={{
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      borderRadius: 14,
      marginBottom: 10,
      overflow:     'hidden',
    }}>
      {/* Urgency top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${urgency.color}, ${urgency.color}44)` }} />

      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding:  '14px 16px',
          cursor:   'pointer',
          display:  'flex',
          gap:      12,
          alignItems: 'flex-start',
        }}
      >
        {/* Vendor badge or placeholder */}
        <div style={{
          width:          38, height: 38,
          borderRadius:   10,
          background:     vendor ? `linear-gradient(135deg, ${vColor}, ${vColor}bb)` : C.surface3,
          border:         vendor ? 'none' : `1px dashed ${C.border2}`,
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          color:          vendor ? '#fff' : C.text3,
          fontSize:       vendor ? 11 : 14,
          fontWeight:     800,
          flexShrink:     0,
          boxShadow:      vendor ? `0 3px 10px ${vColor}33` : 'none',
        }}>
          {vendor ? vendor.short_code : '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category + urgency pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ color: C.text1, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
              {group.category}
            </span>
            <span style={{
              background:   urgency.bg,
              color:        urgency.color,
              border:       `1px solid ${urgency.border}`,
              fontSize:     9,
              fontWeight:   700,
              padding:      '2px 7px',
              borderRadius: 20,
              letterSpacing:'0.04em',
              textTransform:'uppercase',
            }}>
              {urgency.label}
            </span>
          </div>

          {/* Latest update preview */}
          <div style={{
            color:        C.text2,
            fontSize:     12,
            lineHeight:   1.5,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {latestUpdate?.summary || 'No summary available'}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {vendor ? (
              <span style={{
                background: vColor + '20', color: vColor,
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
              }}>
                {vendor.display_name}
              </span>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setAssigningVdr(true) }}
                style={{
                  background: C.surface3, border: `1px dashed ${C.border2}`,
                  color: C.text3, fontSize: 10, padding: '2px 8px', borderRadius: 6,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + Assign vendor
              </button>
            )}
            <span style={{ color: C.text3, fontSize: 10 }}>
              {updates.length} email{updates.length !== 1 ? 's' : ''}
            </span>
            {group.suggested_deadline && (
              <span style={{ color: '#fbbf24', fontSize: 10 }}>
                Due {new Date(group.suggested_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <span style={{ color: C.text3, fontSize: 12, flexShrink: 0, marginTop: 2, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          ▾
        </span>
      </div>

      {/* Expanded: update thread + actions */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>

          {/* Assign vendor dropdown */}
          {assigningVdr && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
              <div style={{ color: C.text2, fontSize: 11, marginBottom: 6 }}>Assign to vendor:</div>
              <select
                autoFocus
                onChange={async e => {
                  if (e.target.value) {
                    await onAssignVendor(group.id, e.target.value)
                    setAssigningVdr(false)
                  }
                }}
                style={{
                  background: C.surface3, border: `1px solid ${C.border2}`,
                  color: C.text1, borderRadius: 7, padding: '7px 10px',
                  fontSize: 12, outline: 'none', fontFamily: 'inherit', width: '100%',
                }}
              >
                <option value="">Select vendor…</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.display_name} — {v.firm_name}</option>
                ))}
              </select>
              <button onClick={() => setAssigningVdr(false)} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 11, marginTop: 8, fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          )}

          {/* Email thread timeline */}
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ color: C.text3, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Email thread · {updates.length} update{updates.length !== 1 ? 's' : ''}
            </div>

            <div style={{ position: 'relative' }}>
              {/* Vertical timeline line */}
              {updates.length > 1 && (
                <div style={{
                  position:  'absolute',
                  left:      6, top: 8, bottom: 8,
                  width:     1,
                  background:`linear-gradient(180deg, ${urgency.color}60, transparent)`,
                }} />
              )}

              {updates.map((update, i) => (
                <UpdateItem
                  key={update.gmail_id || i}
                  update={update}
                  isLatest={i === 0}
                  urgencyColor={urgency.color}
                  isLast={i === updates.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Confirm form or action buttons */}
          <div style={{ padding: '12px 16px 14px', borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
            {confirming ? (
              <div>
                <div style={{ color: C.text2, fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
                  Confirm as activity
                </div>

                {/* Title */}
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Activity title"
                  style={{
                    width: '100%', background: C.surface3, border: `1px solid ${C.border2}`,
                    color: C.text1, borderRadius: 8, padding: '8px 10px', fontSize: 13,
                    outline: 'none', fontFamily: 'inherit', marginBottom: 8,
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {/* Deadline */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text3, fontSize: 10, marginBottom: 4 }}>Deadline</div>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      style={{
                        width: '100%', background: C.surface3, border: `1px solid ${C.border2}`,
                        color: C.text1, borderRadius: 7, padding: '7px 10px', fontSize: 12,
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {/* Priority */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text3, fontSize: 10, marginBottom: 4 }}>Priority</div>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      style={{
                        width: '100%', background: C.surface3, border: `1px solid ${C.border2}`,
                        color: C.text1, borderRadius: 7, padding: '7px 10px', fontSize: 12,
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleConfirm}
                    disabled={saving || !title.trim() || !vendor}
                    className="inbox-action-btn"
                    style={{
                      background:   saving ? C.surface3 : C.accent,
                      border:       'none',
                      color:        saving ? C.text3 : '#fff',
                      borderRadius: 8,
                      padding:      '8px 16px',
                      cursor:       saving || !vendor ? 'default' : 'pointer',
                      fontSize:     12,
                      fontWeight:   600,
                      fontFamily:   'inherit',
                      flex:         1,
                    }}
                  >
                    {saving ? 'Adding…' : !vendor ? 'Assign vendor first' : '✓ Add to tracker'}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text2, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirming(true)}
                  className="inbox-action-btn"
                  style={{
                    background:   C.accent,
                    border:       'none',
                    color:        '#fff',
                    borderRadius: 8,
                    padding:      '8px 16px',
                    cursor:       'pointer',
                    fontSize:     12,
                    fontWeight:   600,
                    fontFamily:   'inherit',
                    flex:         1,
                  }}
                >
                  + Add to tracker
                </button>
                <button
                  onClick={() => onDismiss(group.id)}
                  className="dismiss-btn"
                  style={{
                    background:   'none',
                    border:       `1px solid ${C.border}`,
                    color:        C.text3,
                    borderRadius: 8,
                    padding:      '8px 14px',
                    cursor:       'pointer',
                    fontSize:     12,
                    fontFamily:   'inherit',
                    transition:   'all 0.12s',
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single email update in the thread timeline ────────────────────────────────

function UpdateItem({ update, isLatest, urgencyColor, isLast }) {
  const date = new Date(update.received_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div style={{
      display:      'flex',
      gap:          12,
      paddingLeft:  0,
      marginBottom: isLast ? 12 : 14,
      position:     'relative',
    }}>
      {/* Timeline dot */}
      <div style={{
        width:      13, height: 13,
        borderRadius: '50%',
        background:   isLatest ? urgencyColor : C.surface3,
        border:       `2px solid ${isLatest ? urgencyColor : C.border2}`,
        flexShrink:   0,
        marginTop:    3,
        boxShadow:    isLatest ? `0 0 8px ${urgencyColor}60` : 'none',
        zIndex:       1,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Subject + date */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{
            color:        C.text3,
            fontSize:     10,
            fontWeight:   600,
            letterSpacing:'0.02em',
            textTransform:'uppercase',
          }}>
            {date}
          </span>
          {isLatest && (
            <span style={{ background: urgencyColor + '25', color: urgencyColor, fontSize: 9, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
              Latest
            </span>
          )}
        </div>

        {/* AI summary */}
        <div style={{ color: isLatest ? C.text1 : C.text2, fontSize: 12, lineHeight: 1.55 }}>
          {update.summary}
        </div>

        {/* From */}
        <div style={{ color: C.text3, fontSize: 10, marginTop: 3 }}>
          {update.from_name || update.from_email}
          {update.subject && ` · "${update.subject}"`}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyInbox({ onSync, syncing }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 14, opacity: 0.4 }}>✉</div>
      <div style={{ color: C.text1, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
        Inbox is clear
      </div>
      <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.6, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
        No emails pending review. New vendor emails will appear here automatically after each sync.
      </div>
      <button
        onClick={onSync}
        disabled={syncing}
        style={{
          background:   C.accent,
          border:       'none',
          color:        '#fff',
          borderRadius: 8,
          padding:      '9px 20px',
          cursor:       syncing ? 'default' : 'pointer',
          fontSize:     13,
          fontWeight:   600,
          fontFamily:   'inherit',
          opacity:      syncing ? 0.6 : 1,
        }}
      >
        {syncing ? 'Syncing…' : 'Sync emails now'}
      </button>
    </div>
  )
}
