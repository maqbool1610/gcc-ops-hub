import { useState, useMemo, useEffect } from 'react'
import { useAuth }             from '../hooks/useAuth'
import { useVendors }          from '../hooks/useVendors'
import { useActivities, useAllActivities } from '../hooks/useActivities'
import { useViewport }         from '../hooks/useViewport'
import { useIcebox }           from '../hooks/useIcebox'
import VendorCard              from '../components/VendorCard'
import ActivityRow             from '../components/ActivityRow'
import FilterBar               from '../components/FilterBar'
import ActivityDetail          from '../components/ActivityDetail'
import DependencyBanner        from '../components/DependencyBanner'
import AddActivityForm         from '../components/AddActivityForm'
import AddVendorForm           from '../components/AddVendorForm'
import Icebox                  from '../components/Icebox'
import { ROLES, VENDOR_COLORS, STATUS } from '../lib/constants'

// ─── Design tokens ────────────────────────────────────────────────────────────
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { profile, role, gccId, canEdit, canDelete, canAudit, isGccHead, isVendor, signOut } = useAuth()
  const { isMobile, isTablet, isDesktop } = useViewport()

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedVendorId,   setSelectedVendorId]   = useState(null)
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [filter,             setFilter]             = useState('all')
  const [showAddActivity,    setShowAddActivity]    = useState(false)
  const [addingSubFor,       setAddingSubFor]       = useState(null)   // activity object
  const [showAddVendor,      setShowAddVendor]      = useState(false)
  const [editingVendor,      setEditingVendor]      = useState(null)
  const [mobileTab,       setMobileTab]       = useState('home') // 'home' | 'activity'
  const [showIcebox,      setShowIcebox]      = useState(false)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { vendors, loading: vendorsLoading, createVendor, updateVendor } = useVendors(gccId)
  const { activities: allActivities, refetch: refetchAll }               = useAllActivities(gccId)
  const { activities: vendorActivities, createActivity, deleteActivity,
          updateStatus, updateNote, updateBlocked }                       = useActivities(selectedVendorId)
  const { items: iceboxItems, loading: iceboxLoading, count: iceboxCount,
          assignAndCreate, dismiss: dismissIcebox }                       = useIcebox(gccId)

  // Auto-select for vendor role
  useEffect(() => {
    if (isVendor && profile?.vendor_id && !selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(profile.vendor_id)
    }
  }, [isVendor, profile?.vendor_id, vendors.length, selectedVendorId])

  // Reset tab when going back to grid
  useEffect(() => {
    if (!selectedVendorId) setMobileTab('home')
  }, [selectedVendorId])

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedVendor   = vendors.find(v => v.id === selectedVendorId)
  const selectedActivity = vendorActivities.find(a => a.id === selectedActivityId)
  const vColor = selectedVendor
    ? (selectedVendor.color_hex || VENDOR_COLORS[selectedVendor.category] || '#6b7280')
    : C.accent

  const filteredActivities = useMemo(
    () => vendorActivities.filter(a => filter === 'all' || a.status === filter),
    [vendorActivities, filter]
  )

  const stats = useMemo(() => {
    const total    = allActivities.length
    const active   = allActivities.filter(a => a.status !== 'closed').length
    const flags    = allActivities.filter(a => a.status === 'red_flag').length
    const today    = new Date()
    const in14Days = allActivities.filter(a => {
      if (a.status === 'closed' || !a.deadline) return false
      const days = Math.ceil((new Date(a.deadline) - today) / 86400000)
      return days >= 0 && days <= 14
    }).length
    const waiting  = allActivities.filter(a => a.status === 'waiting').length
    const overdue  = allActivities.filter(a =>
      a.deadline && a.status !== 'closed' && new Date(a.deadline) < today
    ).length
    return { total, active, flags, in14Days, waiting, overdue }
  }, [allActivities])

  const vendorStats = useMemo(() => {
    const map = {}
    allActivities.forEach(a => {
      const vid = a.vendor_id
      if (!map[vid]) map[vid] = { done: 0, active: 0, flags: 0, waiting: 0, total: 0 }
      map[vid].total++
      if (a.status === 'closed')   map[vid].done++
      if (a.status === 'red_flag') map[vid].flags++
      if (a.status === 'waiting')  map[vid].waiting++
      if (a.status !== 'closed')   map[vid].active++
    })
    return map
  }, [allActivities])

  const blockedActivities = useMemo(
    () => allActivities.filter(a => a.blocked_by_id && a.blocked_by?.status !== 'closed' && a.status !== 'closed'),
    [allActivities]
  )

  // Hero operational health card content
  const health = useMemo(() => {
    if (stats.flags > 0) return {
      label:    `${stats.flags} item${stats.flags > 1 ? 's' : ''} flagged`,
      sub:      'Needs your attention',
      icon:     '⚑',
      color:    '#f87171',
      gradient: 'linear-gradient(135deg, #2a0a0a 0%, #180606 100%)',
      border:   '#5c1a1a',
    }
    if (stats.overdue > 0) return {
      label:    `${stats.overdue} overdue deadline${stats.overdue > 1 ? 's' : ''}`,
      sub:      'Past their due date',
      icon:     '◷',
      color:    '#fbbf24',
      gradient: 'linear-gradient(135deg, #1e1508 0%, #120d04 100%)',
      border:   '#4a3810',
    }
    if (stats.in14Days > 0) return {
      label:    `${stats.in14Days} due within 14 days`,
      sub:      'Coming up soon',
      icon:     '◷',
      color:    '#fbbf24',
      gradient: 'linear-gradient(135deg, #1a1306 0%, #100c04 100%)',
      border:   '#3a2e12',
    }
    if (stats.active > 0) return {
      label:    `${stats.active} open items in progress`,
      sub:      'Operations running',
      icon:     '◉',
      color:    '#60a5fa',
      gradient: 'linear-gradient(135deg, #0c1828 0%, #080f1c 100%)',
      border:   '#163248',
    }
    return {
      label:    'All calm. Nothing urgent.',
      sub:      'Operations on track',
      icon:     '✓',
      color:    '#34d399',
      gradient: 'linear-gradient(135deg, #0a1e14 0%, #060e09 100%)',
      border:   '#133828',
    }
  }, [stats])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function selectVendor(id) {
    if (selectedVendorId === id) {
      setSelectedVendorId(null); setSelectedActivityId(null); setShowAddActivity(false); setShowAddVendor(false)
    } else {
      setSelectedVendorId(id); setSelectedActivityId(null); setFilter('all'); setShowAddActivity(false); setShowAddVendor(false)
    }
  }

  function selectActivity(id) {
    setSelectedActivityId(selectedActivityId === id ? null : id)
    setShowAddActivity(false); setShowAddVendor(false); setAddingSubFor(null)
  }

  function goBack() {
    if (selectedActivity || showAddActivity || showAddVendor || editingVendor || addingSubFor) {
      setSelectedActivityId(null); setShowAddActivity(false); setShowAddVendor(false); setEditingVendor(null); setAddingSubFor(null)
    } else if (selectedVendorId) {
      setSelectedVendorId(null); setSelectedActivityId(null)
    }
  }

  async function handleCreateActivity(formData) {
    const { error } = await createActivity(formData)
    if (!error) {
      setShowAddActivity(false)
      setAddingSubFor(null)
      refetchAll().catch(() => {})
    }
    return { error }
  }

  async function handleCreateVendor(formData) {
    const { error } = await createVendor(formData)
    if (!error) setShowAddVendor(false)
    return { error }
  }

  async function handleUpdateVendor(formData) {
    const { error } = await updateVendor(editingVendor.id, formData)
    if (!error) setEditingVendor(null)
    return { error }
  }

  function exportCSV() {
    if (!selectedVendor) return
    const rows = filteredActivities.map(a => {
      const dl = a.deadline ? new Date(a.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
      return `"${a.title}","${dl}","${a.status}","${a.priority || ''}","${a.source}","${(a.note || '').replace(/"/g, '""')}"`
    })
    const csv  = ['Title,Deadline,Status,Priority,Source,Note', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${selectedVendor.display_name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const displayedVendors = isVendor
    ? vendors.filter(v => v.id === profile?.vendor_id)
    : vendors.filter(v => v.is_active)

  // ── Mobile routing ────────────────────────────────────────────────────────
  // Within the 'home' tab: grid → list → detail
  const mobileScreen = (showAddVendor || !!editingVendor) ? 'detail'
    : !selectedVendorId ? 'grid'
    : !selectedActivityId ? 'list'
    : 'detail'

  const showDetailPanel = (!!selectedActivity) || showAddVendor || !!editingVendor
  const showVendorPanel = !!selectedVendorId && !showAddVendor && !editingVendor
  // Panel 1 is narrow whenever anything is open in Panel 2 or 3
  const showPanelNarrow = showVendorPanel || showAddVendor || !!editingVendor

  const vendorCols = isMobile ? 'repeat(2, 1fr)'
    : isTablet ? 'repeat(auto-fill, minmax(160px, 1fr))'
    : 'repeat(auto-fill, minmax(200px, 1fr))'

  // ── Title for mobile top bar ──────────────────────────────────────────────
  const mobileTitle = mobileTab === 'alerts'   ? 'Alerts'
    : mobileTab === 'activity' ? 'All Activity'
    : mobileScreen === 'grid'  ? profile?.gcc?.company_name || 'GCC Ops Hub'
    : mobileScreen === 'list'  ? (selectedVendor?.display_name || '')
    : showAddVendor             ? 'Add Vendor'
    : editingVendor             ? 'Edit Vendor'
    : (selectedActivity?.title || 'Detail')

  const showBack = isMobile && (mobileScreen !== 'grid' || mobileTab !== 'home')

  return (
    <div style={{
      background:    C.bg,
      height:        '100dvh',
      display:       'flex',
      flexDirection: 'column',
      fontFamily:    "'DM Sans','Inter',system-ui,sans-serif",
      color:         C.text1,
      overflow:      'hidden',
    }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        isMobile ? '0 14px' : '0 20px',
        height:         isMobile ? 52 : 54,
        borderBottom:   `1px solid ${C.border}`,
        background:     `linear-gradient(180deg, #0f1220 0%, ${C.bg} 100%)`,
        flexShrink:     0,
        gap:            8,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {isMobile && showBack && (
            <button onClick={() => {
              if (mobileTab !== 'home') { setMobileTab('home'); return }
              goBack()
            }} style={{ background: 'none', border: 'none', color: C.text2, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1, flexShrink: 0, marginRight: 2 }}>
              ‹
            </button>
          )}

          {/* Logo mark */}
          <div style={{
            width:          isMobile ? 30 : 34,
            height:         isMobile ? 30 : 34,
            borderRadius:   10,
            background:     `linear-gradient(135deg, ${C.accent}, #2d5fd4)`,
            border:         `1px solid ${C.accent}40`,
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      `0 0 18px ${C.accent}30, 0 2px 8px #00000060`,
          }}>
            <span style={{ color: 'white', fontSize: isMobile ? 14 : 16, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>G</span>
          </div>

          {isMobile ? (
            <span style={{ color: C.text1, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mobileTitle}
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.text1, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>GCC Ops Hub</span>
              <span style={{ color: C.border2, fontSize: 16, lineHeight: 1 }}>·</span>
              <span style={{ color: C.text3, fontSize: 12 }}>{profile?.gcc?.name || '…'}</span>
            </div>
          )}
        </div>


        {/* Icebox button — GCC Head only */}
        {(isGccHead || role === 'hr_head') && (
          <button
            onClick={() => setShowIcebox(v => !v)}
            style={{
              background:   showIcebox ? C.surface3 : C.surface2,
              border:       `1px solid ${showIcebox ? '#fb923c66' : C.border}`,
              color:        showIcebox ? '#fb923c' : C.text2,
              borderRadius: 20,
              padding:      '4px 12px',
              cursor:       'pointer',
              fontSize:     11,
              fontWeight:   showIcebox ? 600 : 400,
              fontFamily:   'inherit',
              display:      'flex',
              alignItems:   'center',
              gap:          6,
              flexShrink:   0,
              transition:   'all 0.12s',
            }}
          >
            🧊 Icebox
            {iceboxCount > 0 && (
              <span style={{ background: '#fb923c', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>
                {iceboxCount}
              </span>
            )}
          </button>
        )}

        {/* Right */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent }} />
              <span style={{ color: C.text2, fontSize: 11 }}>{ROLES[role]?.label}</span>
              <span style={{ color: C.text3, fontSize: 11 }}>·</span>
              <span style={{ color: C.text1, fontSize: 11, fontWeight: 600 }}>{profile?.name}</span>
            </div>
          )}
          <button onClick={signOut} className="btn-ghost" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text2, borderRadius: 8, padding: isMobile ? '6px 10px' : '5px 13px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ══════════════════════════════════════════════════════════════════
            MOBILE LAYOUT
        ═══════════════════════════════════════════════════════════════════ */}
        {isMobile && (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: 62 }}>

            {/* ── HOME TAB ─────────────────────────────────────────────── */}
            {mobileTab === 'home' && (
              <>
                {/* Screen: vendor grid */}
                {mobileScreen === 'grid' && (
                  <div style={{ flex: 1, overflow: 'auto' }}>
                    {/* Greeting header */}
                    <div style={{ padding: '20px 16px 0' }}>
                      <div style={{ color: C.text2, fontSize: 13, marginBottom: 4 }}>{getGreeting()}</div>
                      <div style={{ color: C.text1, fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 2 }}>
                        {profile?.name?.split(' ')[0] || 'Welcome'}
                      </div>
                      <div style={{ color: C.text3, fontSize: 12, marginBottom: 18 }}>
                        {profile?.gcc?.company_name || ''} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>

                      {/* Hero health card */}
                      <div style={{
                        background:   health.gradient,
                        border:       `1px solid ${health.border}`,
                        borderRadius: 18,
                        padding:      '18px 20px',
                        marginBottom: 20,
                        position:     'relative',
                        overflow:     'hidden',
                      }}>
                        {/* Glow orb */}
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: health.color + '15', filter: 'blur(24px)', pointerEvents: 'none' }} />

                        <div style={{ color: health.color + '99', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                          Operational Status
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <span style={{ fontSize: 20, color: health.color, lineHeight: 1 }}>{health.icon}</span>
                          <span style={{ color: C.text1, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{health.label}</span>
                        </div>
                        <div style={{ color: health.color + 'aa', fontSize: 12 }}>{health.sub}</div>

                        {/* Mini stats row */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${health.color}20` }}>
                          <MiniStat label="Vendors" value={displayedVendors.length} color={health.color} />
                          <MiniStat label="Active"  value={stats.active}           color={health.color} />
                          {stats.flags > 0 && <MiniStat label="Flagged" value={stats.flags} color="#f87171" />}
                        </div>
                      </div>

                      {/* Dependency banner */}
                      {blockedActivities.length > 0 && <DependencyBanner blockedActivities={blockedActivities} />}

                      {/* Vendors label */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ color: C.text3, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vendors</span>
                        <span style={{ color: C.text3, fontSize: 10 }}>{displayedVendors.length}</span>
                      </div>
                    </div>

                    {/* Vendor grid */}
                    {vendorsLoading ? (
                      <div style={{ color: C.text3, fontSize: 13, padding: '8px 16px' }}>Loading…</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: vendorCols, gap: 8, padding: '0 16px 20px' }}>
                        {displayedVendors.map(v => (
                          <VendorCard key={v.id} vendor={v} stats={vendorStats[v.id]} isSelected={false} isNarrow={false} onClick={() => selectVendor(v.id)} />
                        ))}
                        {isGccHead && (
                          <AddVendorCard onClick={() => { setShowAddVendor(true); setSelectedVendorId(null) }} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Screen: activity list */}
                {mobileScreen === 'list' && selectedVendor && (
                  <VendorActivityPanel
                    vendor={selectedVendor} vColor={vColor}
                    activities={filteredActivities} vendorActivities={vendorActivities}
                    filter={filter} onFilterChange={f => { setFilter(f); setSelectedActivityId(null) }}
                    canEdit={canEdit} role={role}
                    selectedActivityId={selectedActivityId}
                    onSelectActivity={selectActivity}
                    showAddActivity={showAddActivity}
                    onAddActivity={() => { setShowAddActivity(true); setSelectedActivityId(null); setAddingSubFor(null) }}
                    onCancelAdd={() => setShowAddActivity(false)}
                    onSaveActivity={handleCreateActivity}
                    addingSubFor={addingSubFor}
                    onAddSub={a => { setAddingSubFor(a); setShowAddActivity(false); setSelectedActivityId(null) }}
                    onCancelSub={() => setAddingSubFor(null)}
                    allActivities={allActivities}
                    onExport={exportCSV}
                    isGccHead={isGccHead}
                    onEditVendor={() => { setEditingVendor(selectedVendor); setSelectedActivityId(null); setShowAddActivity(false) }}
                  />
                )}

                {/* Screen: activity detail */}
                {mobileScreen === 'detail' && (
                  <>
                    {selectedActivity && !showAddVendor && !editingVendor && (
                      <ActivityDetail
                        activity={selectedActivity} vendorColor={vColor}
                        allActivities={allActivities} canEdit={canEdit} canAudit={canAudit} isVendor={isVendor}
                        onClose={goBack}
                        onStatusChange={(id, s) => updateStatus(id, s)}
                        onNoteChange={(id, n)   => updateNote(id, n)}
                        onDependencyChange={(id, bid) => updateBlocked(id, bid)}
                        onDelete={canDelete ? async (id) => { await deleteActivity(id); goBack() } : null}
                      />
                    )}
                    {(showAddVendor || editingVendor) && (
                      <AddVendorForm existingVendor={editingVendor}
                        onSave={editingVendor ? handleUpdateVendor : handleCreateVendor}
                        onCancel={() => { setShowAddVendor(false); setEditingVendor(null) }}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* ── ACTIVITY TAB ─────────────────────────────────────────── */}
            {mobileTab === 'activity' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                <div style={{ color: C.text2, fontSize: 13, marginBottom: 16 }}>
                  All activity across {displayedVendors.length} vendors
                </div>
                {allActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: C.text3 }}>
                    <div style={{ fontSize: 14 }}>No activities yet</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Select a vendor and add activities</div>
                  </div>
                ) : (
                  [...allActivities]
                    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
                    .map(a => {
                      const vendor = vendors.find(v => v.id === a.vendor_id)
                      const color  = vendor ? (vendor.color_hex || VENDOR_COLORS[vendor.category] || '#6b7280') : '#6b7280'
                      return (
                        <ActivityRow key={a.id} activity={a} vendorColor={color}
                          isSelected={false}
                          onClick={() => { setSelectedVendorId(a.vendor_id); setTimeout(() => { setSelectedActivityId(a.id); setMobileTab('home') }, 50) }}
                        />
                      )
                    })
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TABLET / DESKTOP LAYOUT
        ═══════════════════════════════════════════════════════════════════ */}
        {!isMobile && (
          <>
            {/* ── PANEL 1 ──────────────────────────────────────────────── */}
            <div style={{
              width:       showPanelNarrow ? 240 : '100%',
              flexShrink:  0,
              borderRight: showPanelNarrow ? `1px solid ${C.border}` : 'none',
              overflow:    'auto',
              padding:     showPanelNarrow ? '10px 8px' : '22px 22px',
              transition:  'width 0.18s ease',
              background:  C.bg,
            }}>
              {!showPanelNarrow && (
                <div style={{ marginBottom: 20 }}>
                  {/* Greeting */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ color: C.text2, fontSize: 12, marginBottom: 3 }}>{getGreeting()}</div>
                    <div style={{ color: C.text1, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em' }}>
                      {profile?.name?.split(' ')[0] || 'Welcome back'}
                    </div>
                  </div>

                  {blockedActivities.length > 0 && <DependencyBanner blockedActivities={blockedActivities} />}

                  {/* Hero health card — desktop (horizontal) */}
                  <div style={{
                    background:   health.gradient,
                    border:       `1px solid ${health.border}`,
                    borderRadius: 16,
                    padding:      '16px 20px',
                    marginBottom: 16,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          16,
                    position:     'relative',
                    overflow:     'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: 20, width: 100, height: 100, borderRadius: '50%', background: health.color + '12', filter: 'blur(24px)', pointerEvents: 'none' }} />
                    <div style={{ fontSize: 24, color: health.color, lineHeight: 1, flexShrink: 0 }}>{health.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: C.text1, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 3 }}>{health.label}</div>
                      <div style={{ color: health.color + 'aa', fontSize: 11 }}>{health.sub}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                      <MiniStat label="Vendors" value={displayedVendors.length} color={health.color} />
                      <MiniStat label="Active"  value={stats.active}           color={health.color} />
                      {stats.flags > 0 && <MiniStat label="Flagged" value={stats.flags} color="#f87171" />}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: C.text3, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vendors</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: C.text3, fontSize: 10 }}>{displayedVendors.length} vendors</span>
                      <span style={{ color: C.text3, fontSize: 10 }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {vendorsLoading ? (
                <div style={{ color: C.text3, fontSize: 13, padding: 8 }}>Loading vendors…</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: showPanelNarrow ? '1fr' : vendorCols, gap: showPanelNarrow ? 0 : 10 }}>
                  {displayedVendors.map(v => (
                    <VendorCard key={v.id} vendor={v} stats={vendorStats[v.id]}
                      isSelected={selectedVendorId === v.id} isNarrow={showPanelNarrow}
                      onClick={() => selectVendor(v.id)}
                    />
                  ))}
                  {isGccHead && !showPanelNarrow && (
                    <AddVendorCard onClick={() => { setShowAddVendor(true); setSelectedVendorId(null); setSelectedActivityId(null) }} />
                  )}
                </div>
              )}
            </div>

            {/* ── PANEL 2 ──────────────────────────────────────────────── */}
            {showVendorPanel && selectedVendor && (
              <VendorActivityPanel
                vendor={selectedVendor} vColor={vColor}
                activities={filteredActivities} vendorActivities={vendorActivities}
                filter={filter} onFilterChange={f => { setFilter(f); setSelectedActivityId(null) }}
                canEdit={canEdit} role={role}
                selectedActivityId={selectedActivityId}
                onSelectActivity={selectActivity}
                showAddActivity={showAddActivity}
                onAddActivity={() => { setShowAddActivity(true); setSelectedActivityId(null); setAddingSubFor(null) }}
                onCancelAdd={() => setShowAddActivity(false)}
                onSaveActivity={handleCreateActivity}
                addingSubFor={addingSubFor}
                onAddSub={a => { setAddingSubFor(a); setShowAddActivity(false); setSelectedActivityId(null) }}
                onCancelSub={() => setAddingSubFor(null)}
                allActivities={allActivities}
                onExport={exportCSV}
                isGccHead={isGccHead}
                onEditVendor={() => { setEditingVendor(selectedVendor); setSelectedActivityId(null); setShowAddActivity(false) }}
                onBack={() => { setSelectedVendorId(null); setSelectedActivityId(null); setShowAddActivity(false) }}
                width={isDesktop && showDetailPanel ? 260 : undefined}
                showBorder={isDesktop && showDetailPanel}
                filterSummary={filter !== 'all' ? `${filteredActivities.length} of ${vendorActivities.length} · ${filter.replace('_', ' ')}` : null}
              />
            )}

            {/* ── PANEL 3 (desktop) ────────────────────────────────────── */}
            {isDesktop && selectedActivity && !showAddVendor && !editingVendor && (
              <ActivityDetail
                activity={selectedActivity} vendorColor={vColor}
                allActivities={allActivities} canEdit={canEdit} canAudit={canAudit} isVendor={isVendor}
                onClose={() => setSelectedActivityId(null)}
                onStatusChange={(id, s) => updateStatus(id, s)}
                onNoteChange={(id, n)   => updateNote(id, n)}
                onDependencyChange={(id, bid) => updateBlocked(id, bid)}
                onDelete={canDelete ? async (id) => { await deleteActivity(id); setSelectedActivityId(null) } : null}
              />
            )}

            {/* Tablet: detail as right overlay */}
            {isTablet && selectedActivity && !showAddVendor && !editingVendor && (
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(380px, 90vw)', background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-8px 0 32px #00000070' }}>
                <ActivityDetail
                  activity={selectedActivity} vendorColor={vColor}
                  allActivities={allActivities} canEdit={canEdit} canAudit={canAudit} isVendor={isVendor}
                  onClose={() => setSelectedActivityId(null)}
                  onStatusChange={(id, s) => updateStatus(id, s)}
                  onNoteChange={(id, n)   => updateNote(id, n)}
                  onDependencyChange={(id, bid) => updateBlocked(id, bid)}
                  onDelete={canDelete ? async (id) => { await deleteActivity(id); setSelectedActivityId(null) } : null}
                />
              </div>
            )}

            {(showAddVendor || editingVendor) && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <AddVendorForm existingVendor={editingVendor}
                  onSave={editingVendor ? handleUpdateVendor : handleCreateVendor}
                  onCancel={() => { setShowAddVendor(false); setEditingVendor(null) }}
                />
              </div>
            )}

            {/* ── Icebox slide-in panel ─────────────────────────────────── */}
            {showIcebox && (
              <div style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: 'min(400px, 45vw)',
                background: C.bg,
                borderLeft: `1px solid #fb923c33`,
                zIndex: 20,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '-8px 0 40px #00000070',
              }}>
                <Icebox
                  items={iceboxItems}
                  loading={iceboxLoading}
                  vendors={vendors.filter(v => v.is_active)}
                  count={iceboxCount}
                  onAssign={async (item, vendorId) => {
                    await assignAndCreate(item, vendorId)
                    refetchAll().catch(() => {})
                  }}
                  onDismiss={dismissIcebox}
                />
              </div>
            )}

          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ───────────────────────────────────────── */}
      {isMobile && (
        <div style={{
          position:      'fixed',
          bottom:        0, left: 0, right: 0,
          height:        62,
          background:    C.surface,
          borderTop:     `1px solid ${C.border}`,
          display:       'flex',
          alignItems:    'stretch',
          zIndex:        100,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {[
            { id: 'home',     label: 'Home',     icon: '⊞', badge: 0 },
            { id: 'activity', label: 'Activity', icon: '≡', badge: 0 },
          ].map(tab => {
            const active = mobileTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setMobileTab(tab.id); if (tab.id === 'home' && selectedVendorId) { /* keep context */ } }}
                style={{
                  flex:           1,
                  background:     'none',
                  border:         'none',
                  cursor:         'pointer',
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            3,
                  position:       'relative',
                  color:          active ? C.accent : C.text3,
                  fontFamily:     'inherit',
                  transition:     'color 0.12s',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: C.accent, borderRadius: '0 0 2px 2px' }} />
                )}
                <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.02em' }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <div style={{ position: 'absolute', top: 8, right: '26%', background: '#f87171', color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 20, padding: '1px 4px', minWidth: 14, textAlign: 'center' }}>
                    {tab.badge}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #2e3760; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); }

        .vendor-grid-card { transition: transform 0.14s ease, box-shadow 0.14s ease !important; }
        .vendor-grid-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px #00000080 !important; }
        .activity-row:hover { background: ${C.surface2} !important; }
        .btn-ghost:hover { border-color: ${C.border2} !important; color: ${C.text1} !important; }
        .add-vendor-card { transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .add-vendor-card:hover { border-color: #3d4560 !important; color: #7a84a0 !important; background: ${C.surface2} !important; }
        .add-sub-link:hover { color: ${C.accent} !important; }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: 16, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ color: color + '88', fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function AddVendorCard({ onClick }) {
  return (
    <div onClick={onClick} className="add-vendor-card" style={{
      background: C.surface, border: `1px dashed ${C.border2}`, borderRadius: 14,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: C.text3, gap: 7, minHeight: 108, cursor: 'pointer',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>+</div>
      <span style={{ fontSize: 12, letterSpacing: '0.01em' }}>Add vendor</span>
    </div>
  )
}

// Shared vendor activity panel (used by both mobile and desktop)
function VendorActivityPanel({
  vendor, vColor, activities, vendorActivities,
  filter, onFilterChange, canEdit, role,
  selectedActivityId, onSelectActivity,
  showAddActivity, onAddActivity, onCancelAdd, onSaveActivity,
  addingSubFor, onAddSub, onCancelSub,
  allActivities, onExport, isGccHead, onEditVendor,
  onBack, width, showBorder, filterSummary,
}) {
  return (
    <div style={{
      width:         width || (onBack ? 'calc(100% - 240px)' : '100%'),
      borderRight:   showBorder ? `1px solid ${C.border}` : 'none',
      display:       'flex', flexDirection: 'column', overflow: 'hidden',
      transition:    'width 0.18s ease', background: C.bg,
      flex:          width ? 'none' : 1,
    }}>
      {/* Vendor colour bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${vColor}, ${vColor}40)`, flexShrink: 0 }} />

      {/* Vendor header */}
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text2, cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0 }}>‹</button>
        )}
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${vColor}, ${vColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
          {vendor.short_code}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text1, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.display_name}</div>
          <div style={{ color: C.text3, fontSize: 11 }}>{vendor.firm_name}</div>
        </div>
        <button onClick={onExport} className="btn-ghost" style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text2, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', flexShrink: 0 }}>↓</button>
        {isGccHead && (
          <button onClick={onEditVendor} style={{ background: 'none', border: 'none', color: C.text2, cursor: 'pointer', fontSize: 13, padding: '4px 6px', fontFamily: 'inherit' }} title="Edit">✎</button>
        )}
      </div>

      <FilterBar activeFilter={filter} onChange={onFilterChange} />

      {!canEdit && (
        <div style={{ background: C.surface2, padding: '6px 14px', borderBottom: `1px solid ${C.border}`, color: C.text3, fontSize: 11, flexShrink: 0 }}>
          👁 Read-only · {ROLES[role]?.label}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activities.length === 0 && !showAddActivity ? (
          <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
            <div style={{ color: C.border2, fontSize: 28, lineHeight: 1 }}>○</div>
            <div style={{ color: C.text2, fontSize: 13 }}>
              {filter !== 'all' ? `No ${filter.replace('_', ' ')} activities` : 'No activities yet'}
            </div>
            {filter === 'all' && canEdit && <div style={{ color: C.text3, fontSize: 11 }}>Use "+ Add activity" below</div>}
          </div>
        ) : (
          activities.map(a => (
            <ActivityRow key={a.id} activity={a} vendorColor={vColor}
              isSelected={selectedActivityId === a.id}
              onClick={() => onSelectActivity(a.id)}
              onAddSub={canEdit ? onAddSub : null}
            />
          ))
        )}

        {/* Sub-activity inline form */}
        {addingSubFor && (
          <div style={{ borderTop: `2px solid ${vColor}40`, background: C.surface2 }}>
            <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.text3, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sub-item of</span>
              <span style={{ color: vColor, fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{addingSubFor.title}</span>
            </div>
            <AddActivityForm
              allActivities={allActivities}
              initialBlockedById={addingSubFor.id}
              onSave={onSaveActivity}
              onCancel={onCancelSub}
            />
          </div>
        )}

        {canEdit && !showAddActivity && !addingSubFor && (
          <div onClick={onAddActivity} style={{ padding: '11px 14px 11px 24px', color: C.text3, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderTop: `1px solid ${C.border}`, transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.text2}
            onMouseLeave={e => e.currentTarget.style.color = C.text3}
          >
            + Add activity
          </div>
        )}
        {showAddActivity && <AddActivityForm allActivities={allActivities} onSave={onSaveActivity} onCancel={onCancelAdd} />}
      </div>

      {filterSummary && (
        <div style={{ padding: '8px 14px', borderTop: `1px solid ${C.border}`, background: C.surface, color: C.text2, fontSize: 11, flexShrink: 0 }}>
          Showing {filterSummary}
        </div>
      )}
    </div>
  )
}
