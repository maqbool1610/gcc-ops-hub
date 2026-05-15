import { useState } from 'react'
import { VENDOR_COLORS } from '../lib/constants'

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

const URGENCY_COLOR = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#8891a8',
}

// ── Icebox ────────────────────────────────────────────────────────────────────
// Shows operational emails Claude couldn't match to a vendor.
// User picks a vendor and hits Go — activity is created automatically.

export default function Icebox({ items = [], loading, vendors = [], count, onAssign, onDismiss }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.bg,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${C.border}`,
        background: `linear-gradient(180deg, #0f1220 0%, ${C.surface} 100%)`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🧊</span>
          <div>
            <div style={{ color: C.text1, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
              Icebox
              {count > 0 && (
                <span style={{
                  background: '#fb923c', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 20, marginLeft: 8,
                }}>{count}</span>
              )}
            </div>
            <div style={{ color: C.text3, fontSize: 11, marginTop: 2 }}>
              Emails Claude couldn't match · Assign a vendor to add to tracker
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {loading ? (
          <div style={{ color: C.text3, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🧊</div>
            <div style={{ color: C.text1, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Icebox is clear</div>
            <div style={{ color: C.text2, fontSize: 12, lineHeight: 1.6 }}>
              All operational emails have been matched to vendors automatically.
            </div>
          </div>
        ) : (
          items.map(item => (
            <IceboxItem
              key={item.id}
              item={item}
              vendors={vendors}
              onAssign={onAssign}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Single icebox item ────────────────────────────────────────────────────────

function IceboxItem({ item, vendors, onAssign, onDismiss }) {
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [saving, setSaving] = useState(false)

  const update      = item.updates?.[0]
  const urgColor    = URGENCY_COLOR[item.urgency] || URGENCY_COLOR.low
  const receivedAt  = update?.received_at
    ? new Date(update.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  async function handleGo() {
    if (!selectedVendorId) return
    setSaving(true)
    await onAssign(item, selectedVendorId)
    setSaving(false)
  }

  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      borderRadius: 12,
      marginBottom: 10,
      overflow:     'hidden',
    }}>
      {/* Urgency bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${urgColor}, ${urgColor}44)` }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Category + urgency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ color: C.text1, fontWeight: 700, fontSize: 13 }}>{item.category}</span>
          <span style={{
            background: urgColor + '20', color: urgColor,
            fontSize: 9, fontWeight: 700, padding: '2px 6px',
            borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{item.urgency}</span>
          {item.suggested_deadline && (
            <span style={{ color: '#fbbf24', fontSize: 10, marginLeft: 'auto' }}>
              Due {new Date(item.suggested_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Email summary */}
        {update?.summary && (
          <div style={{ color: C.text2, fontSize: 12, lineHeight: 1.55, marginBottom: 8 }}>
            {update.summary}
          </div>
        )}

        {/* From + date */}
        <div style={{ color: C.text3, fontSize: 10, marginBottom: 12 }}>
          {update?.from_name || update?.from_email}
          {update?.subject && ` · "${update.subject}"`}
          {receivedAt && ` · ${receivedAt}`}
        </div>

        {/* Vendor selector + Go */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedVendorId}
            onChange={e => setSelectedVendorId(e.target.value)}
            style={{
              flex:        1,
              background:  C.surface3,
              border:      `1px solid ${C.border2}`,
              color:       selectedVendorId ? C.text1 : C.text3,
              borderRadius: 8,
              padding:     '7px 10px',
              fontSize:    12,
              outline:     'none',
              fontFamily:  'inherit',
              cursor:      'pointer',
            }}
          >
            <option value="">Select vendor…</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.display_name} — {v.firm_name}
              </option>
            ))}
          </select>

          <button
            onClick={handleGo}
            disabled={!selectedVendorId || saving}
            style={{
              background:   (!selectedVendorId || saving) ? C.surface3 : C.accent,
              border:       'none',
              color:        (!selectedVendorId || saving) ? C.text3 : '#fff',
              borderRadius: 8,
              padding:      '7px 18px',
              fontSize:     12,
              fontWeight:   700,
              fontFamily:   'inherit',
              cursor:       (!selectedVendorId || saving) ? 'default' : 'pointer',
              flexShrink:   0,
              transition:   'all 0.12s',
            }}
          >
            {saving ? '…' : 'Go'}
          </button>

          <button
            onClick={() => onDismiss(item.id)}
            title="Dismiss"
            style={{
              background:   'none',
              border:       `1px solid ${C.border}`,
              color:        C.text3,
              borderRadius: 8,
              padding:      '7px 10px',
              fontSize:     11,
              fontFamily:   'inherit',
              cursor:       'pointer',
              flexShrink:   0,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
