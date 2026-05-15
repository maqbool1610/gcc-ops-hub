import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── useIcebox ─────────────────────────────────────────────────────────────────
// Operational emails Claude couldn't match to a vendor.
// Human assigns vendor → activity auto-created → item leaves icebox.

export function useIcebox(gccId) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!gccId) return
    setLoading(true)
    const { data } = await supabase
      .from('email_activity_groups')
      .select('*')
      .eq('gcc_id', gccId)
      .eq('status', 'pending')
      .is('vendor_id', null)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [gccId])

  useEffect(() => { load() }, [load])

  // Assign vendor + create activity in one action
  async function assignAndCreate(item, vendorId) {
    const update   = item.updates?.[0]
    const dateStr  = update
      ? new Date(update.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
    const note     = update ? `[${dateStr}] ${update.summary}` : ''
    const priority = item.urgency === 'critical' ? 'critical'
      : item.urgency === 'high'   ? 'high'
      : item.urgency === 'medium' ? 'medium'
      : 'low'

    const { error } = await supabase.from('activities').insert({
      vendor_id: vendorId,
      title:     item.category,
      status:    'open',
      source:    'email',
      priority,
      deadline:  item.suggested_deadline || null,
      note,
    })
    if (error) return { error: error.message }

    await supabase
      .from('email_activity_groups')
      .update({ status: 'confirmed', vendor_id: vendorId })
      .eq('id', item.id)

    setItems(prev => prev.filter(i => i.id !== item.id))
    return { error: null }
  }

  async function dismiss(itemId) {
    await supabase
      .from('email_activity_groups')
      .update({ status: 'dismissed' })
      .eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  return { items, loading, count: items.length, assignAndCreate, dismiss, reload: load }
}
