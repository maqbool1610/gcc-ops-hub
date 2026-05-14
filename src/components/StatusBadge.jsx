import { STATUS } from '../lib/constants'

// Status badge pill.
// small=true for compact inline use (activity list rows).
// large=true for the detail panel status selector.

export default function StatusBadge({ status, small = false, large = false }) {
  const s = STATUS[status]
  if (!s) return null

  const fontSize = large ? 12 : small ? 10 : 11
  const padding  = large ? '5px 12px' : small ? '2px 8px' : '3px 10px'
  const dotSize  = large ? 6 : 5

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          5,
      padding,
      borderRadius: 20,
      background:   s.bg,
      color:        s.color,
      fontSize,
      fontWeight:   500,
      border:       `1px solid ${s.dot}55`,
      whiteSpace:   'nowrap',
      flexShrink:   0,
      letterSpacing: '0.01em',
    }}>
      <span style={{
        width:        dotSize,
        height:       dotSize,
        borderRadius: '50%',
        background:   s.dot,
        flexShrink:   0,
      }} />
      {s.label}
    </span>
  )
}
