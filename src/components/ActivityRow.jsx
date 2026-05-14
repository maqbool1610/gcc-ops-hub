import StatusBadge from './StatusBadge'
import { STATUS, SOURCE_ICON } from '../lib/constants'

// Single activity row in the middle panel list.

export default function ActivityRow({ activity, vendorColor, isSelected, onClick, onAddSub }) {
  const s = STATUS[activity.status]

  const deadline = activity.deadline
    ? new Date(activity.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null

  const isOverdue = activity.deadline && activity.status !== 'closed'
    && new Date(activity.deadline) < new Date()

  const isBlocked = !!activity.blocked_by_id &&
    activity.blocked_by?.status !== 'closed'

  const isRedFlag = activity.status === 'red_flag'

  return (
    <div
      onClick={onClick}
      className="activity-row"
      style={{
        padding:      '11px 14px 11px 0',
        borderBottom: '1px solid #17171a',
        cursor:       'pointer',
        background:   isSelected ? '#161a28' : 'transparent',
        display:      'flex',
        alignItems:   'stretch',
        gap:          0,
        position:     'relative',
      }}
    >
      {/* Left accent — vendor colour when selected, status colour for red flags */}
      <div style={{
        width:        3,
        flexShrink:   0,
        background:   isSelected
          ? vendorColor
          : isRedFlag
            ? s?.dot
            : 'transparent',
        borderRadius: '0 3px 3px 0',
        marginRight:  11,
        minHeight:    '100%',
        alignSelf:    'stretch',
        transition:   'background 0.1s ease',
      }} />

      {/* Status dot */}
      <div style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        background:   s?.dot || '#6b7280',
        flexShrink:   0,
        marginTop:    6,
        boxShadow:    isRedFlag ? `0 0 8px ${s.dot}80` : 'none',
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
        {/* Title */}
        <div style={{
          color:        isSelected ? '#f0f0f2' : '#d4d4d8',
          fontSize:     13,
          fontWeight:   isRedFlag ? 600 : isSelected ? 500 : 400,
          marginBottom: 4,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          display:      'flex',
          alignItems:   'center',
          gap:          5,
          lineHeight:   1.3,
        }}>
          {isBlocked && (
            <span style={{
              color:        '#f59e0b',
              fontSize:     10,
              flexShrink:   0,
              background:   '#2d1f00',
              border:       '1px solid #4a3400',
              borderRadius: 4,
              padding:      '1px 4px',
              fontWeight:   600,
              letterSpacing:'0.02em',
            }}>⚠</span>
          )}
          {activity.title}
        </div>

        {/* Meta row */}
        <div style={{
          display:    'flex',
          gap:        8,
          alignItems: 'center',
          fontSize:   11,
        }}>
          <span style={{ color: '#3f3f46' }}>
            {SOURCE_ICON[activity.source] || '✏'}
          </span>

          {deadline ? (
            <span style={{
              color:      isOverdue ? '#f87171' : '#52525b',
              fontWeight: isOverdue ? 600 : 400,
              display:    'flex',
              alignItems: 'center',
              gap:        3,
            }}>
              {isOverdue && <span style={{ color: '#f87171' }}>⚑</span>}
              {deadline}
            </span>
          ) : (
            <span style={{ color: '#2a2a32' }}>No deadline</span>
          )}

          {activity.note && (
            <span style={{
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              maxWidth:     120,
              color:        '#3f3f46',
              fontStyle:    'italic',
            }}>
              {activity.note}
            </span>
          )}
        </div>

        {/* Inline sub-item link */}
        {onAddSub && (
          <div
            onClick={e => { e.stopPropagation(); onAddSub(activity) }}
            className="add-sub-link"
            style={{
              marginTop:  5,
              fontSize:   10,
              color:      '#3d4560',
              cursor:     'pointer',
              display:    'inline-flex',
              alignItems: 'center',
              gap:        3,
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>+</span> Add activity
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{ flexShrink: 0, alignSelf: 'center', paddingRight: 2 }}>
        <StatusBadge status={activity.status} small />
      </div>
    </div>
  )
}
