import { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'
import { STATUS, SOURCE_ICON } from '../lib/constants'
import { useAuditLog } from '../hooks/useActivities'

// Activity Detail panel — Screen 3 (Section 5.3)
// Opens alongside the activity list. Shows status selector, note editor,
// dependency info, and (GCC Head only) collapsible audit trail.

export default function ActivityDetail({
  activity,
  vendorColor,
  allActivities = [],
  canEdit,
  canAudit,
  isVendor,
  onClose,
  onStatusChange,
  onNoteChange,
  onDependencyChange,
  onDelete,
}) {
  const [editingNote,   setEditingNote]   = useState(false)
  const [noteVal,       setNoteVal]       = useState(activity.note || '')
  const [showAudit,     setShowAudit]     = useState(false)
  const [editingDep,    setEditingDep]    = useState(false)
  const [blockedById,   setBlockedById]   = useState(activity.blocked_by_id || '')
  const [saving,        setSaving]        = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { entries: auditEntries, loading: auditLoading } = useAuditLog(
    showAudit ? activity.id : null
  )

  // Sync note value when activity changes
  useEffect(() => {
    setNoteVal(activity.note || '')
    setEditingNote(false)
    setEditingDep(false)
    setConfirmDelete(false)
  }, [activity.id, activity.note])

  const deadline = activity.deadline
    ? new Date(activity.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'No deadline set'

  const isBlocked = !!activity.blocked_by_id &&
    activity.blocked_by?.status !== 'closed'

  // Non-closed activities for the dependency dropdown (excluding this activity itself)
  const blockableActivities = allActivities.filter(
    a => a.status !== 'closed' && a.id !== activity.id
  )

  // ── Save note ────────────────────────────────────────────────────────────
  async function handleSaveNote() {
    setSaving(true)
    await onNoteChange(activity.id, noteVal)
    setSaving(false)
    setEditingNote(false)
  }

  // ── Save dependency ──────────────────────────────────────────────────────
  async function handleSaveDependency() {
    setSaving(true)
    await onDependencyChange(activity.id, blockedById || null)
    setSaving(false)
    setEditingDep(false)
  }

  // ── Export audit log as CSV ──────────────────────────────────────────────
  function exportAuditCSV() {
    const rows = auditEntries.map(e =>
      `"${e.timestamp}","${e.user_display}","${e.user_role}","${e.action}","${e.field_changed}","${e.from_value || ''}","${e.to_value || ''}"`
    )
    const csv  = ['Timestamp,User,Role,Action,Field,From,To', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `audit_${activity.title.slice(0, 30).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      flex:          1,
      display:       'flex',
      flexDirection: 'column',
      overflow:      'hidden',
      background:    '#10131e',
    }}>
      {/* ── Vendor color top accent bar ────────────────────────────────────── */}
      <div style={{
        height:     3,
        background: `linear-gradient(90deg, ${vendorColor}, ${vendorColor}44)`,
        flexShrink: 0,
      }} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        padding:        '12px 16px',
        borderBottom:   '1px solid #1c2238',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
        background:     '#10131e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={activity.status} />
          {isBlocked && (
            <span style={{
              background:   '#2d2208',
              color:        '#fbbf24',
              fontSize:     10,
              padding:      '2px 8px',
              borderRadius: 10,
              fontWeight:   600,
            }}>
              ⚠ DEPENDENCY BLOCKED
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {canAudit && (
            <button
              onClick={() => setShowAudit(v => !v)}
              style={{
                background:   showAudit ? '#1e3a5f' : '#1c2238',
                border:       `1px solid ${showAudit ? '#3b82f6' : '#27272a'}`,
                color:        showAudit ? '#60a5fa' : '#71717a',
                borderRadius: 7,
                padding:      '4px 10px',
                cursor:       'pointer',
                fontSize:     11,
                fontFamily:   'inherit',
                transition:   'all 0.1s',
              }}
            >
              🕓 Audit trail
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background:   '#1c2238',
              border:       '1px solid #27272a',
              color:        '#71717a',
              borderRadius: 7,
              padding:      '4px 10px',
              cursor:       'pointer',
              fontSize:     11,
              fontFamily:   'inherit',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px 12px' }}>

        {/* Source + deadline line */}
        <div style={{ color: '#52525b', fontSize: 11, marginBottom: 6 }}>
          {SOURCE_ICON[activity.source] || '✏'}
          {activity.source === 'email'    && ' Captured from email'}
          {activity.source === 'calendar' && ' Regulatory calendar'}
          {activity.source === 'manual'   && ' Added manually'}
          {' · '}{deadline}
        </div>

        {/* Title */}
        <h3 style={{
          color:      '#f0f0f2',
          fontSize:   16,
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: 16,
          margin:     '0 0 16px 0',
        }}>
          {activity.title}
        </h3>

        {/* ── Email timeline ─────────────────────────────────────────────── */}
        {activity.source === 'email' && activity.timeline?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Email history · {activity.timeline.length}</span>
            <div style={{ marginTop: 10, position: 'relative' }}>
              {/* Vertical connector line */}
              {activity.timeline.length > 1 && (
                <div style={{
                  position:   'absolute',
                  left:       15,
                  top:        24,
                  bottom:     24,
                  width:      1,
                  background: 'linear-gradient(180deg, #1c2238 0%, #1c2238 100%)',
                }} />
              )}
              {[...activity.timeline]
                .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime())
                .map((entry, i) => (
                  <TimelineEntry key={entry.gmail_id || i} entry={entry} vendorColor={vendorColor} />
                ))
              }
            </div>
          </div>
        )}

        {/* ── Note ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'space-between',
            marginBottom:  6,
          }}>
            <span style={labelStyle}>Note</span>
            {canEdit && !editingNote && (
              <button
                onClick={() => { setEditingNote(true); setNoteVal(activity.note || '') }}
                style={linkBtn}
              >
                Edit
              </button>
            )}
          </div>

          {editingNote ? (
            <div>
              <textarea
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                rows={3}
                style={{
                  width:        '100%',
                  background:   '#1c2238',
                  border:       '1px solid #3f3f46',
                  color:        '#e4e4e7',
                  borderRadius: 8,
                  padding:      '8px 10px',
                  fontSize:     13,
                  resize:       'vertical',
                  minHeight:    60,
                  outline:      'none',
                  fontFamily:   'inherit',
                  boxSizing:    'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button
                  onClick={handleSaveNote}
                  disabled={saving}
                  style={saving ? { ...btnSave, opacity: 0.6 } : btnSave}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditingNote(false)} style={btnCancelInline}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{
              background:  '#111113',
              border:      '1px solid #1c1c20',
              borderRadius: 8,
              padding:     '9px 12px',
              fontSize:    13,
              color:       activity.note ? '#a1a1aa' : '#3f3f46',
              minHeight:   40,
              lineHeight:  1.6,
            }}>
              {activity.note || 'No note added.'}
            </div>
          )}
        </div>

        {/* ── Status selector ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...labelStyle, marginBottom: 9 }}>
            {canEdit || isVendor ? 'Update status' : 'Status'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(STATUS).map(([k, v]) => {
              const isCurrent = activity.status === k
              const clickable = canEdit || isVendor
              return (
                <button
                  key={k}
                  onClick={() => clickable && onStatusChange(activity.id, k)}
                  style={{
                    background:   isCurrent ? v.bg : 'transparent',
                    border:       `1px solid ${isCurrent ? v.dot : '#27272a'}`,
                    color:        isCurrent ? v.color : '#52525b',
                    padding:      isCurrent ? '5px 13px' : '4px 12px',
                    borderRadius: 20,
                    cursor:       clickable ? 'pointer' : 'default',
                    fontSize:     11,
                    fontWeight:   isCurrent ? 500 : 400,
                    opacity:      !clickable && !isCurrent ? 0.35 : 1,
                    transition:   'all 0.12s ease',
                    fontFamily:   'inherit',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                    letterSpacing: isCurrent ? '0.01em' : 0,
                  }}
                >
                  {isCurrent && (
                    <span style={{
                      width: 5, height: 5,
                      borderRadius: '50%',
                      background: v.dot,
                      flexShrink: 0,
                    }} />
                  )}
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Dependency (blocked by) ────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={labelStyle}>Blocked by</span>
            {canEdit && !editingDep && (
              <button
                onClick={() => { setEditingDep(true); setBlockedById(activity.blocked_by_id || '') }}
                style={linkBtn}
              >
                {activity.blocked_by_id ? 'Change' : 'Add dependency'}
              </button>
            )}
          </div>

          {editingDep ? (
            <div>
              <select
                value={blockedById}
                onChange={e => setBlockedById(e.target.value)}
                style={{ ...inputStyle, width: '100%', marginBottom: 6 }}
              >
                <option value="">None — not blocked by anything</option>
                {blockableActivities.map(a => (
                  <option key={a.id} value={a.id}>
                    [{a.vendor?.short_code || '?'}] {a.title}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSaveDependency} disabled={saving} style={saving ? { ...btnSave, opacity: 0.6 } : btnSave}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditingDep(false)} style={btnCancelInline}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{
              background:   '#111113',
              border:       '1px solid #1c1c20',
              borderRadius: 8,
              padding:      '9px 12px',
              fontSize:     12,
              color:        isBlocked ? '#fbbf24' : '#3f3f46',
            }}>
              {activity.blocked_by
                ? `⚠ [${activity.blocked_by.vendor?.short_code || '?'}] ${activity.blocked_by.title} (${STATUS[activity.blocked_by.status]?.label || activity.blocked_by.status})`
                : 'No dependency set.'}
            </div>
          )}
        </div>

        {/* ── Audit trail (GCC Head only) ────────────────────────────────── */}
        {showAudit && canAudit && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={labelStyle}>Audit trail — who changed what</span>
              {auditEntries.length > 0 && (
                <button onClick={exportAuditCSV} style={linkBtn}>↓ Export CSV</button>
              )}
            </div>

            <div style={{
              background:   '#111113',
              border:       '1px solid #1c1c20',
              borderRadius: 10,
              overflow:     'hidden',
            }}>
              {auditLoading ? (
                <div style={{ padding: 14, color: '#3f3f46', fontSize: 12 }}>Loading…</div>
              ) : auditEntries.length === 0 ? (
                <div style={{ padding: 14, color: '#3f3f46', fontSize: 12 }}>No audit entries yet.</div>
              ) : (
                <div style={{ padding: '0 12px' }}>
                  {auditEntries.map((entry) => (
                    <AuditRow key={entry.id} entry={entry} statusMap={STATUS} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ color: '#3f3f46', fontSize: 10, marginTop: 6 }}>
              All changes are captured automatically. Immutable — cannot be edited or deleted.
            </div>
          </div>
        )}

        {/* ── Delete (GCC Head only) ─────────────────────────────────────── */}
        {canEdit && onDelete && (
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #1c2238' }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  background:   'none',
                  border:       'none',
                  color:        '#52525b',
                  fontSize:     11,
                  cursor:       'pointer',
                  fontFamily:   'inherit',
                  padding:      0,
                }}
              >
                Delete activity…
              </button>
            ) : (
              <div>
                <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
                  Delete "{activity.title}"? This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onDelete(activity.id)}
                    style={{
                      background:   '#450a0a',
                      border:       '1px solid #ef4444',
                      color:        '#f87171',
                      borderRadius: 6,
                      padding:      '4px 12px',
                      cursor:       'pointer',
                      fontSize:     11,
                      fontFamily:   'inherit',
                    }}
                  >
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={btnCancelInline}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


// ── TimelineEntry sub-component ──────────────────────────────────────────────

function TimelineEntry({ entry, vendorColor }) {
  const date = entry.received_at
    ? new Date(entry.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
  const time = entry.received_at
    ? new Date(entry.received_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : ''

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      {/* Dot on the timeline line */}
      <div style={{ flexShrink: 0, paddingTop: 10 }}>
        <div style={{
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   vendorColor,
          border:       `2px solid #10131e`,
          boxShadow:    `0 0 0 1px ${vendorColor}44`,
          position:     'relative',
          zIndex:       1,
        }} />
      </div>

      {/* Card */}
      <div style={{
        flex:         1,
        background:   '#0d0f1a',
        border:       '1px solid #1c2238',
        borderRadius: 10,
        padding:      '10px 12px',
        minWidth:     0,
      }}>
        {/* From + date row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ color: '#e4e4e7', fontSize: 12, fontWeight: 600 }}>
              {entry.from_name || entry.from_email}
            </span>
            {entry.from_name && entry.from_email && (
              <span style={{ color: '#3f3f46', fontSize: 11, marginLeft: 5 }}>
                &lt;{entry.from_email}&gt;
              </span>
            )}
          </div>
          <div style={{ color: '#3f3f46', fontSize: 10, flexShrink: 0, textAlign: 'right', lineHeight: 1.4 }}>
            <div>{date}</div>
            <div>{time}</div>
          </div>
        </div>

        {/* Subject */}
        {entry.subject && (
          <div style={{
            color:        '#52525b',
            fontSize:     11,
            marginBottom: 6,
            fontStyle:    'italic',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {entry.subject}
          </div>
        )}

        {/* Claude summary */}
        <div style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.55 }}>
          {entry.summary}
        </div>
      </div>
    </div>
  )
}

// ── AuditRow sub-component ───────────────────────────────────────────────────

function AuditRow({ entry, statusMap }) {
  const roleColor = {
    gcc_head: '#3b82f6',
    hr_head:  '#10b981',
    us_head:  '#8b5cf6',
    vendor:   '#f59e0b',
    email:    '#f59e0b',
    auto:     '#6b7280',
  }

  const ts = new Date(entry.timestamp).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })

  return (
    <div style={{
      display:      'flex',
      gap:          10,
      padding:      '8px 0',
      borderBottom: '1px solid #1c2238',
      alignItems:   'flex-start',
    }}>
      <div style={{ flexShrink: 0, paddingTop: 3 }}>
        <div style={{
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   roleColor[entry.user_role] || '#6b7280',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display:    'flex',
          gap:        6,
          alignItems: 'center',
          marginBottom: 2,
          flexWrap:   'wrap',
        }}>
          <span style={{ color: '#e4e4e7', fontSize: 12, fontWeight: 500 }}>
            {entry.user_display}
          </span>
          <span style={{ color: '#3f3f46', fontSize: 11 }}>{entry.action}</span>
          {entry.field_changed === 'status' && entry.from_value && (
            <span style={{ color: '#52525b', fontSize: 11 }}>
              <span style={{ color: statusMap[entry.from_value]?.color || '#94a3b8' }}>
                {statusMap[entry.from_value]?.label || entry.from_value}
              </span>
              {' → '}
              <span style={{ color: statusMap[entry.to_value]?.color || '#94a3b8' }}>
                {statusMap[entry.to_value]?.label || entry.to_value}
              </span>
            </span>
          )}
          {entry.field_changed === 'note' && (
            <span style={{ color: '#52525b', fontSize: 11, fontStyle: 'italic' }}>
              note updated
            </span>
          )}
        </div>
        <div style={{ color: '#3f3f46', fontSize: 10 }}>{ts}</div>
      </div>
    </div>
  )
}

// ── Shared styles ────────────────────────────────────────────────────────────

const labelStyle = {
  color:         '#3f3f46',
  fontSize:      10,
  fontWeight:    500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const linkBtn = {
  background:   'none',
  border:       'none',
  color:        '#52525b',
  cursor:       'pointer',
  fontSize:     11,
  fontFamily:   'inherit',
  padding:      0,
  textDecoration: 'underline',
}

const btnSave = {
  background:   '#1e3a5f',
  border:       '1px solid #3b82f6',
  color:        '#60a5fa',
  borderRadius: 6,
  padding:      '4px 12px',
  cursor:       'pointer',
  fontSize:     11,
  fontFamily:   'inherit',
}

const btnCancelInline = {
  background:   'none',
  border:       '1px solid #27272a',
  color:        '#52525b',
  borderRadius: 6,
  padding:      '4px 12px',
  cursor:       'pointer',
  fontSize:     11,
  fontFamily:   'inherit',
}

const inputStyle = {
  background:   '#1c2238',
  border:       '1px solid #27272a',
  color:        '#e4e4e7',
  borderRadius: 7,
  padding:      '7px 10px',
  fontSize:     12,
  outline:      'none',
  fontFamily:   'inherit',
  boxSizing:    'border-box',
}
