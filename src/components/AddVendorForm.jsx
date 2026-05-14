import { useState } from 'react'
import { VENDOR_CATEGORIES, VENDOR_COLORS } from '../lib/constants'

// Add / edit vendor panel — slides in on the right (no modal, Section 11 rules)
// Used for both creating a new vendor and editing an existing one.

export default function AddVendorForm({ existingVendor = null, onSave, onCancel }) {
  const isEdit = !!existingVendor

  const [displayName,  setDisplayName]  = useState(existingVendor?.display_name  || '')
  const [shortCode,    setShortCode]    = useState(existingVendor?.short_code    || '')
  const [category,     setCategory]     = useState(existingVendor?.category      || 'Custom')
  const [firmName,     setFirmName]     = useState(existingVendor?.firm_name     || '')
  const [contactName,  setContactName]  = useState(existingVendor?.contact_name  || '')
  const [contactEmail, setContactEmail] = useState(existingVendor?.contact_email || '')
  const [emailDomains, setEmailDomains] = useState(
    existingVendor?.email_domains?.join(', ') || ''
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Auto-fill short code from display name
  function handleDisplayNameChange(val) {
    setDisplayName(val)
    if (!isEdit && !shortCode) {
      // Guess a short code: first word, up to 4 chars, uppercase
      const guess = val.split(/\s+/)[0].slice(0, 4).toUpperCase()
      setShortCode(guess)
    }
  }

  function validate() {
    const errs = {}
    if (!displayName.trim())         errs.displayName = 'Display name is required.'
    if (!shortCode.trim())           errs.shortCode   = 'Short code is required.'
    if (shortCode.length > 4)        errs.shortCode   = 'Short code must be ≤ 4 characters.'
    return errs
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    setErrors({})

    const domains = emailDomains
      .split(',')
      .map(d => d.trim().toLowerCase())
      .filter(Boolean)

    const payload = {
      display_name:  displayName.trim(),
      short_code:    shortCode.trim().toUpperCase().slice(0, 4),
      category,
      firm_name:     firmName.trim()     || null,
      contact_name:  contactName.trim()  || null,
      contact_email: contactEmail.trim() || null,
      email_domains: domains,
      color_hex:     VENDOR_COLORS[category] || VENDOR_COLORS.Custom,
    }

    const { error } = await onSave(payload)
    setSaving(false)
    if (error) setErrors({ save: error })
  }

  return (
    <div style={{
      height:        '100%',
      display:       'flex',
      flexDirection: 'column',
      background:    '#10131e',
      overflow:      'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:      '12px 16px',
        borderBottom: '1px solid #1c2238',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        flexShrink:   0,
        background:   '#10131e',
      }}>
        <span style={{ color: '#f0f0f2', fontSize: 13, fontWeight: 600 }}>
          {isEdit ? 'Edit Vendor' : 'Add Vendor'}
        </span>
        <button onClick={onCancel} style={btnClose}>✕</button>
      </div>

      {/* Form body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 20px' }}>

        <Field label="Display name *" error={errors.displayName}>
          <input
            type="text"
            placeholder="e.g. Chartered Accountant"
            value={displayName}
            onChange={e => handleDisplayNameChange(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Field label="Short code * (max 4 chars)" error={errors.shortCode}>
              <input
                type="text"
                placeholder="CA"
                value={shortCode}
                onChange={e => setShortCode(e.target.value.toUpperCase().slice(0, 4))}
                style={{ ...inputStyle, textTransform: 'uppercase', width: '100%' }}
              />
            </Field>
          </div>
          <div style={{ flex: 2 }}>
            <Field label="Category">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                {VENDOR_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Firm / company name">
          <input
            type="text"
            placeholder="e.g. Sharma & Associates"
            value={firmName}
            onChange={e => setFirmName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Primary contact name">
          <input
            type="text"
            placeholder="e.g. Rajesh Sharma"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Contact email">
          <input
            type="email"
            placeholder="e.g. rajesh@sharmaassoc.com"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Email domains (comma-separated, for auto-detection)">
          <input
            type="text"
            placeholder="e.g. sharmaassoc.com, sharma.in"
            value={emailDomains}
            onChange={e => setEmailDomains(e.target.value)}
            style={inputStyle}
          />
          <div style={{ color: '#3d4560', fontSize: 10, marginTop: 4 }}>
            Emails from these domains will be matched to this vendor automatically (Sprint 3).
          </div>
        </Field>

        {errors.save && (
          <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.save}</div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding:    '12px 16px',
        borderTop:  '1px solid #1c2238',
        display:    'flex',
        gap:        8,
        flexShrink: 0,
        background: '#10131e',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saving ? { ...btnPrimary, opacity: 0.6 } : btnPrimary}
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vendor'}
        </button>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display:     'block',
        color:       '#3d4560',
        fontSize:    10,
        fontWeight:  500,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}>
        {label}
      </label>
      {children}
      {error && <div style={{ color: '#f87171', fontSize: 11, marginTop: 3 }}>{error}</div>}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = {
  width:        '100%',
  background:   '#161a28',
  border:       '1px solid #1c2238',
  color:        '#edf0f8',
  borderRadius: 7,
  padding:      '7px 10px',
  fontSize:     12,
  outline:      'none',
  fontFamily:   'inherit',
  boxSizing:    'border-box',
}

const btnClose = {
  background:   '#161a28',
  border:       '1px solid #1c2238',
  color:        '#8891a8',
  borderRadius: 6,
  padding:      '3px 10px',
  cursor:       'pointer',
  fontSize:     12,
  fontFamily:   'inherit',
}

const btnPrimary = {
  background:   '#1a2d52',
  border:       '1px solid #4f80ef',
  color:        '#7da4f8',
  borderRadius: 6,
  padding:      '6px 16px',
  cursor:       'pointer',
  fontSize:     12,
  fontFamily:   'inherit',
  fontWeight:   600,
}

const btnSecondary = {
  background:   'none',
  border:       '1px solid #1c2238',
  color:        '#3d4560',
  borderRadius: 6,
  padding:      '6px 14px',
  cursor:       'pointer',
  fontSize:     12,
  fontFamily:   'inherit',
}
