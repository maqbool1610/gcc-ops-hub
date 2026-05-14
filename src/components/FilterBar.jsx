import { STATUS } from '../lib/constants'

// Horizontal pill filter bar above the activity list.

const FILTERS = [
  ['all', 'All'],
  ...Object.entries(STATUS).map(([k, v]) => [k, v.label]),
]

export default function FilterBar({ activeFilter, onChange }) {
  return (
    <div style={{
      display:      'flex',
      gap:          5,
      flexWrap:     'wrap',
      padding:      '9px 12px',
      borderBottom: '1px solid #17171a',
      background:   '#0a0a0c',
      flexShrink:   0,
      alignItems:   'center',
    }}>
      {FILTERS.map(([key, label]) => {
        const active = activeFilter === key
        const s      = STATUS[key]

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              background:   active
                ? (key === 'all' ? '#27272a' : s?.bg || '#27272a')
                : 'transparent',
              border:       `1px solid ${active
                ? (key === 'all' ? '#3f3f46' : s?.dot || '#3f3f46')
                : '#1e1e22'}`,
              color:        active
                ? (key === 'all' ? '#e4e4e7' : s?.color || '#e4e4e7')
                : '#3f3f46',
              padding:      '4px 11px',
              borderRadius: 20,
              cursor:       'pointer',
              fontSize:     11,
              fontWeight:   active ? 500 : 400,
              transition:   'all 0.12s ease',
              fontFamily:   'inherit',
              display:      'flex',
              alignItems:   'center',
              gap:          5,
              letterSpacing: active ? '0.01em' : 0,
            }}
          >
            {active && key !== 'all' && (
              <span style={{
                width:        5,
                height:       5,
                borderRadius: '50%',
                background:   s?.dot,
                flexShrink:   0,
              }} />
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}
