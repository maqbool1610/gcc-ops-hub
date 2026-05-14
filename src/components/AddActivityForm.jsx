import { useState } from 'react'
import { STATUS } from '../lib/constants'

// Inline form at the bottom of the activity list (Section 5.2 — Add Activity)
// No modal dialogs. Appears inline in the list. Source always set to "manual".

export default function AddActivityForm({ onSave, onCancel, allActivities = [], initialBlockedById = '' }) {
  const [title,       setTitle]       = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [status,      setStatus]      = useState('open')
  const [note,        setNote]        = useState('')
  const [blockedById, setBlockedById] = useState(initialBlockedById)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  // Non-closed activities from all vendors for the dependency dropdown
  const blockableActivities = allActivities.filter(
    a => a.status !== 'closed'
  )

  async function handleSave() {
    if (!title.trim()) {
      setError('Activity title is required.')
      return
    }
    setSaving(true)
    setError(null)

    const { error: saveError } = await onSave({
      title:        title.trim(),
      deadline:     deadline || null,
      status,
      note:         note.trim(),
      source:       'manual',
      blocked_by_id: blockedById || null,
    })

    setSaving(false)
    if (saveError) {
      setError(saveError)
    }
    // onSave should handle clearing the form on success
  }

  return (
    <div style={{
      padding:      '14px 14px',
      borderTop:    '1px solid #17171a',
      background:   '#0e0e10',
    }}>
      <div style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        New Activity
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Activity title *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSave()}
        autoFocus
        style={inputStyle}
      />

      {/* Deadline + Status row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        >
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Note */}
      <textarea
        placeholder="Note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={2}
        style={{ ...inputStyle, marginTop: 8, resize: 'vertical', minHeight: 44 }}
      />

      {/* Blocked by (dependency linking) */}
      {blockableActivities.length > 0 && (
        <select
          value={blockedById}
          onChange={e => setBlockedById(e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        >
          <option value="">No dependency (not blocked)</option>
          {blockableActivities.map(a => (
            <option key={a.id} value={a.id}>
              ⚠ Blocked by: [{a.vendor?.short_code || '?'}] {a.title}
            </option>
          ))}
        </select>
      )}

      {/* Error */}
      {error && (
        <div style={{ color: '#f87171', fontSize: 11, marginTop: 6 }}>{error}</div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saving ? { ...btnPrimary, opacity: 0.6 } : btnPrimary}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} style={btnSecondary}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width:        '100%',
  background:   '#17171a',
  border:       '1px solid #27272a',
  color:        '#e4e4e7',
  borderRadius: 7,
  padding:      '7px 10px',
  fontSize:     12,
  outline:      'none',
  fontFamily:   'inherit',
  boxSizing:    'border-box',
}

const btnPrimary = {
  background:   '#1e3a5f',
  border:       '1px solid #3b82f6',
  color:        '#60a5fa',
  borderRadius: 6,
  padding:      '5px 14px',
  cursor:       'pointer',
  fontSize:     12,
  fontFamily:   'inherit',
}

const btnSecondary = {
  background:   'none',
  border:       '1px solid #27272a',
  color:        '#52525b',
  borderRadius: 6,
  padding:      '5px 14px',
  cursor:       'pointer',
  fontSize:     12,
  fontFamily:   'inherit',
}
