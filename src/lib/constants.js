// ─── STATUS MODEL (Section 4) ─────────────────────────────────────────────────
// Five statuses. Colours are SEMANTIC — never use these colours for anything else.

export const STATUS = {
  open: {
    label: 'Open',
    color: '#94a3b8',    // text
    bg:    '#1e293b',    // badge background
    dot:   '#64748B',    // indicator dot
  },
  in_process: {
    label: 'In Process',
    color: '#60a5fa',
    bg:    '#1e3a5f',
    dot:   '#3B82F6',
  },
  waiting: {
    label: 'Waiting',
    color: '#fbbf24',
    bg:    '#2d2208',
    dot:   '#F59E0B',
  },
  red_flag: {
    label: 'Red Flag',
    color: '#f87171',
    bg:    '#2d0a0a',
    dot:   '#EF4444',
  },
  closed: {
    label: 'Closed',
    color: '#4ade80',
    bg:    '#052e16',
    dot:   '#22C55E',
  },
}

// ─── USER ROLES (Section 2) ──────────────────────────────────────────────────

export const ROLES = {
  gcc_head: {
    label:     'GCC Head',
    flag:      '🇮🇳',
    canEdit:   true,
    canDelete: true,
    canAudit:  true,
  },
  hr_head: {
    label:     'HR Head',
    flag:      '🇮🇳',
    canEdit:   true,
    canDelete: false,
    canAudit:  false,
  },
  us_head: {
    label:     'US Head',
    flag:      '🇺🇸',
    canEdit:   false,
    canDelete: false,
    canAudit:  false,
  },
  vendor: {
    label:     'Vendor',
    flag:      '🏢',
    canEdit:   false,  // can update own status only — handled separately
    canDelete: false,
    canAudit:  false,
  },
}

// ─── VENDOR COLOURS (Section 11.3) ───────────────────────────────────────────

export const VENDOR_COLORS = {
  CA:        '#3B82F6',  // Blue
  CS:        '#8B5CF6',  // Purple
  Building:  '#F59E0B',  // Amber
  Payroll:   '#10B981',  // Emerald
  Industry:  '#EC4899',  // Pink
  Insurance: '#06B6D4',  // Cyan
  Legal:     '#F97316',  // Orange
  Recruit:   '#84CC16',  // Lime
  Custom:    '#6B7280',  // Grey
}

// ─── COLOUR PALETTE (Section 11.2) ───────────────────────────────────────────

export const COLORS = {
  bg:          '#09090B',
  surface:     '#0C0C0D',
  elevated:    '#111113',
  borderSubtle:'#17171A',
  borderStrong:'#27272A',
  textPrimary: '#F0F0F2',
  textSecond:  '#A1A1AA',
  textMuted:   '#52525B',
  textFaint:   '#3F3F46',
}

// ─── SOURCE ICONS ─────────────────────────────────────────────────────────────

export const SOURCE_ICON = {
  email:    '✉',
  calendar: '📅',
  manual:   '✏',
}

// ─── DEFAULT VENDOR CATEGORIES ────────────────────────────────────────────────

export const VENDOR_CATEGORIES = [
  { value: 'CA',        label: 'Chartered Accountant' },
  { value: 'CS',        label: 'Company Secretary' },
  { value: 'Building',  label: 'Building / Facility' },
  { value: 'Payroll',   label: 'Payroll' },
  { value: 'Industry',  label: 'Industry Bodies' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Legal',     label: 'Legal' },
  { value: 'Recruit',   label: 'Recruitment / RPO' },
  { value: 'Custom',    label: 'Custom' },
]
