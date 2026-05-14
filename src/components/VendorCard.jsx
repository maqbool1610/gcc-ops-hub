import { VENDOR_COLORS } from '../lib/constants'

export default function VendorCard({ vendor, stats, isSelected, isNarrow, onClick }) {
  const color = vendor.color_hex || VENDOR_COLORS[vendor.category] || VENDOR_COLORS.Custom
  const { done = 0, flags = 0, total = 0 } = stats || {}
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
  const hasFlag = flags > 0

  // ── NARROW: sidebar list item ──────────────────────────────────────────────
  if (isNarrow) {
    return (
      <div
        onClick={onClick}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      '10px 14px',
          cursor:       'pointer',
          background:   isSelected ? '#13131a' : 'transparent',
          borderLeft:   `3px solid ${isSelected ? color : 'transparent'}`,
          borderBottom: '1px solid #18181b',
          transition:   'all 0.12s ease',
        }}
      >
        <div style={{
          width:          30, height: 30,
          borderRadius:   8,
          background:     color,
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          color:          '#fff',
          fontSize:       vendor.short_code.length > 2 ? 9 : 10,
          fontWeight:     700,
          flexShrink:     0,
          letterSpacing:  '-0.01em',
        }}>
          {vendor.short_code}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize:     12,
            fontWeight:   isSelected ? 600 : 400,
            color:        isSelected ? '#f0f0f2' : '#a1a1aa',
            overflow:     'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {vendor.display_name}
          </div>
          <div style={{ fontSize: 10, color: '#3f3f46', marginTop: 2 }}>
            {total === 0
              ? 'No activities'
              : <>{done} done · {total - done} open{hasFlag && <span style={{ color: '#f87171' }}> · {flags}⚑</span>}</>}
          </div>
        </div>
        {/* Mini progress dot */}
        {total > 0 && (
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: `conic-gradient(${color} ${pct}%, #1c1c22 0%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: isSelected ? '#13131a' : '#0a0c15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700,
              color: pct === 100 ? color : '#52525b',
            }}>
              {pct}%
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── GRID: full card ────────────────────────────────────────────────────────
  return (
    <div
      onClick={onClick}
      className="vendor-grid-card"
      style={{
        background:   isSelected ? '#111118' : '#10131e',
        border:       `1px solid ${isSelected ? color + '66' : hasFlag ? '#3d1515' : '#1c2238'}`,
        borderRadius: 14,
        overflow:     'hidden',
        cursor:       'pointer',
        position:     'relative',
      }}
    >
      {/* Coloured top bar */}
      <div style={{
        height:     4,
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        opacity:    isSelected ? 1 : 0.7,
      }} />

      <div style={{ padding: '15px 16px 14px' }}>
        {/* Header */}
        <div style={{
          display:       'flex',
          alignItems:    'flex-start',
          justifyContent:'space-between',
          gap:           8,
          marginBottom:  14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width:          44, height: 44,
              borderRadius:   12,
              background:     `linear-gradient(135deg, ${color}, ${color}cc)`,
              display:        'flex', alignItems: 'center', justifyContent: 'center',
              color:          '#fff',
              fontSize:       vendor.short_code.length > 2 ? 10 : 13,
              fontWeight:     800,
              flexShrink:     0,
              letterSpacing:  '-0.02em',
              boxShadow:      isSelected
                ? `0 0 0 2px ${color}55, 0 4px 16px ${color}44`
                : `0 4px 12px ${color}30`,
            }}>
              {vendor.short_code}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize:     13,
                fontWeight:   600,
                color:        '#f0f0f2',
                overflow:     'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight:   1.3,
              }}>
                {vendor.display_name}
              </div>
              <div style={{
                fontSize:     11,
                color:        '#52525b',
                marginTop:    3,
                overflow:     'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {vendor.firm_name}
              </div>
            </div>
          </div>

          {hasFlag && (
            <div style={{
              background:   '#2d0a0a',
              color:        '#fca5a5',
              fontSize:     10,
              fontWeight:   500,
              padding:      '3px 8px',
              borderRadius: 8,
              border:       '1px solid #4a1a1a',
              flexShrink:   0,
              whiteSpace:   'nowrap',
            }}>
              {flags}⚑
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          height:       5,
          background:   '#1c1c25',
          borderRadius: 5,
          overflow:     'hidden',
          marginBottom: 9,
        }}>
          <div style={{
            width:      `${pct}%`,
            height:     '100%',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            borderRadius: 5,
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
            {total === 0 ? (
              <span style={{ color: '#3f3f46' }}>No activities yet</span>
            ) : (
              <>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{done}</span>
                <span style={{ color: '#2a2a32' }}>done</span>
                <span style={{ color: '#71717a' }}>{total - done} open</span>
              </>
            )}
          </div>
          <span style={{
            fontSize:           12,
            fontWeight:         600,
            color:              pct > 0 ? '#a1a1aa' : '#2a2a32',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {pct > 0 ? `${pct}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
