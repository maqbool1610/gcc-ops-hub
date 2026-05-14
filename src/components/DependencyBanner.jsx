import { useState } from 'react'

// Dependency alert banner (Section 5.1)
// Appears on main dashboard when any activity has an unresolved blocked_by link.
// Dismissible per session — reappears on reload if still unresolved.

export default function DependencyBanner({ blockedActivities }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !blockedActivities || blockedActivities.length === 0) {
    return null
  }

  // Show up to 3 blocking situations in the banner
  const shown = blockedActivities.slice(0, 3)

  return (
    <div style={{
      background:   '#2d2208',
      border:       '1px solid #78350f',
      borderRadius: 8,
      padding:      '10px 14px',
      margin:       '0 0 14px 0',
      display:      'flex',
      alignItems:   'flex-start',
      justifyContent: 'space-between',
      gap:          12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          marginBottom: shown.length > 1 ? 6 : 0,
        }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>
            {blockedActivities.length} {blockedActivities.length === 1 ? 'activity' : 'activities'} blocked by unresolved dependencies
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {shown.map((act) => {
            const daysLeft = act.deadline
              ? Math.ceil((new Date(act.deadline) - new Date()) / 86400000)
              : null

            return (
              <div key={act.id} style={{ color: '#a16207', fontSize: 11, paddingLeft: 19 }}>
                <span style={{ color: '#fbbf24' }}>
                  {act.vendor?.short_code} — {act.title}
                </span>
                {' '}blocked by{' '}
                <span style={{ color: '#fbbf24' }}>
                  {act.blocked_by?.vendor?.short_code} — {act.blocked_by?.title}
                </span>
                {daysLeft !== null && (
                  <span style={{ color: daysLeft < 0 ? '#f87171' : '#a16207' }}>
                    {' '}({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})
                  </span>
                )}
              </div>
            )
          })}
          {blockedActivities.length > 3 && (
            <div style={{ color: '#a16207', fontSize: 11, paddingLeft: 19 }}>
              +{blockedActivities.length - 3} more blocked activities
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        title="Dismiss until next reload"
        style={{
          background: 'none',
          border:     'none',
          color:      '#a16207',
          cursor:     'pointer',
          fontSize:   14,
          flexShrink: 0,
          padding:    '0 4px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
