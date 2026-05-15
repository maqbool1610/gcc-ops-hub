import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── useEmailInbox ─────────────────────────────────────────────────────────────
// Fetches email_activity_groups for the current GCC.
// Provides confirm / dismiss / triggerSync actions.

export function useEmailInbox(gccId) {
  const [groups,  setGroups]  = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error,   setError]   = useState(null)

  // ── Load groups ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!gccId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('email_activity_groups')
      .select(`
        *,
        vendor:vendor_id (
          id, display_name, short_code, color_hex, category
        )
      `)
      .eq('gcc_id', gccId)
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })

    if (!error) setGroups(data || [])
    else setError(error.message)
    setLoading(false)
  }, [gccId])

  useEffect(() => { load() }, [load])

  // ── Confirm: creates an activity from the group ─────────────────────────────
  async function confirm(group, { title, deadline, priority, note } = {}) {
    const vendor = group.vendor
    if (!vendor) return { error: 'No vendor matched — assign one first.' }

    const activityTitle = title || group.category

    // Insert the activity
    const { data: act, error: actErr } = await supabase
      .from('activities')
      .insert({
        vendor_id: vendor.id,
        title:     activityTitle,
        status:    'open',
        source:    'email',
        priority:  priority || 'medium',
        deadline:  deadline || group.suggested_deadline || null,
        note:      note || buildNoteFromUpdates(group.updates),
      })
      .select()
      .single()

    if (actErr) return { error: actErr.message }

    // Mark group as confirmed
    await supabase
      .from('email_activity_groups')
      .update({ status: 'confirmed', confirmed_activity_id: act.id })
      .eq('id', group.id)

    setGroups(prev => prev.filter(g => g.id !== group.id))
    return { error: null, activity: act }
  }

  // ── Dismiss ─────────────────────────────────────────────────────────────────
  async function dismiss(groupId) {
    await supabase
      .from('email_activity_groups')
      .update({ status: 'dismissed' })
      .eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  // ── Assign vendor manually ──────────────────────────────────────────────────
  async function assignVendor(groupId, vendorId) {
    const { error } = await supabase
      .from('email_activity_groups')
      .update({ vendor_id: vendorId })
      .eq('id', groupId)

    if (!error) await load()
    return { error: error?.message || null }
  }

  // ── Trigger email sync via Edge Function ────────────────────────────────────
  // Fire-and-forget: we kick off the function and don't wait for it to finish.
  // Keeping the connection open would cause EarlyDrop if the function outlasts
  // the browser's timeout. Instead we poll for new results after a short delay.
  async function triggerSync(gccId) {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Fire the request — intentionally do NOT await the response body.
      // keepalive: true lets the request survive even if the tab navigates away.
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-emails`,
        {
          method:    'POST',
          keepalive: true,
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ gcc_id: gccId }),
        }
      ).catch(() => {}) // suppress unhandled rejection

      // Poll for new inbox rows: check at 10s, 25s, 45s, 70s
      const delays = [10_000, 15_000, 20_000, 25_000]
      for (const delay of delays) {
        await new Promise(r => setTimeout(r, delay))
        await load()
      }
    } catch (err) {
      console.error('Sync error:', err.message)
    } finally {
      setSyncing(false)
    }
  }

  const pendingCount = groups.length

  return { groups, loading, syncing, error, pendingCount, confirm, dismiss, assignVendor, triggerSync, reload: load }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildNoteFromUpdates(updates = []) {
  if (!updates.length) return ''
  return updates
    .slice()
    .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
    .map(u => {
      const date = new Date(u.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      return `[${date}] ${u.summary}`
    })
    .join('\n')
}
