import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// useAllActivities — all activities for a GCC (for dashboard stats + dependency)
// Joins through vendors to scope to gccId.
// ─────────────────────────────────────────────────────────────────────────────

export function useAllActivities(gccId) {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetchAll = useCallback(async () => {
    if (!gccId) return
    setError(null)

    // Step 1: get all vendor IDs for this GCC
    // (more reliable than filtering on a joined table column in PostgREST)
    const { data: vendorData, error: vendorErr } = await supabase
      .from('vendors')
      .select('id, display_name, short_code, color_hex, category')
      .eq('gcc_id', gccId)
      .eq('is_active', true)

    if (vendorErr) {
      setError(vendorErr.message)
      setLoading(false)
      return
    }

    const vendorIds = (vendorData || []).map(v => v.id)
    if (vendorIds.length === 0) {
      setActivities([])
      setLoading(false)
      return
    }

    // Build a lookup map for fast vendor enrichment
    const vendorMap = {}
    ;(vendorData || []).forEach(v => { vendorMap[v.id] = v })

    // Step 2: fetch all activities for those vendors
    const { data, error: err } = await supabase
      .from('activities')
      .select(`
        id, title, deadline, status, priority, source,
        blocked_by_id, is_recurring, note, vendor_id,
        created_at, updated_at,
        blocked_by:blocked_by_id (
          id, title, status,
          vendor:vendors (display_name, short_code)
        )
      `)
      .in('vendor_id', vendorIds)
      .order('deadline', { ascending: true, nullsFirst: false })

    if (err) {
      setError(err.message)
    } else {
      // Enrich each activity with its vendor metadata
      const enriched = (data || []).map(a => ({
        ...a,
        vendor: vendorMap[a.vendor_id] || null,
      }))
      setActivities(enriched)
    }
    setLoading(false)
  }, [gccId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { activities, loading, error, refetch: fetchAll }
}


// ─────────────────────────────────────────────────────────────────────────────
// useActivities — activities for a single vendor, with full CRUD
// ─────────────────────────────────────────────────────────────────────────────

export function useActivities(vendorId) {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetchActivities = useCallback(async () => {
    if (!vendorId) {
      setActivities([])
      setLoading(false)
      return
    }
    setError(null)

    const { data, error: err } = await supabase
      .from('activities')
      .select(`
        *,
        blocked_by:blocked_by_id (
          id, title, status,
          vendor:vendors (display_name, short_code)
        )
      `)
      .eq('vendor_id', vendorId)
      .order('deadline', { ascending: true, nullsFirst: false })

    if (err) {
      setError(err.message)
    } else {
      setActivities(data || [])
    }
    setLoading(false)
  }, [vendorId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function createActivity({ title, deadline, status = 'open', note = '', source = 'manual', blocked_by_id = null }) {
    const { data, error: err } = await supabase
      .from('activities')
      .insert({
        vendor_id: vendorId,
        title,
        deadline:      deadline || null,
        status,
        note,
        source,
        blocked_by_id: blocked_by_id || null,
      })
      .select()
      .single()

    if (err) return { error: err.message }
    fetchActivities().catch(() => {})   // refresh without blocking save
    return { data }
  }

  async function updateActivity(id, updates) {
    const { data, error: err } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (err) return { error: err.message }
    fetchActivities().catch(() => {})   // refresh without blocking
    return { data }
  }

  async function deleteActivity(id) {
    const { error: err } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (err) return { error: err.message }
    fetchActivities().catch(() => {})   // refresh without blocking
    return { success: true }
  }

  // Convenience wrappers
  const updateStatus  = (id, status)       => updateActivity(id, { status })
  const updateNote    = (id, note)         => updateActivity(id, { note })
  const updateBlocked = (id, blocked_by_id) => updateActivity(id, { blocked_by_id: blocked_by_id || null })

  return {
    activities,
    loading,
    error,
    refetch:       fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    updateStatus,
    updateNote,
    updateBlocked,
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// useAuditLog — audit entries for a single activity (GCC Head only)
// ─────────────────────────────────────────────────────────────────────────────

export function useAuditLog(activityId) {
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const fetchEntries = useCallback(async () => {
    if (!activityId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('auditlog')
      .select('*')
      .eq('activity_id', activityId)
      .order('timestamp', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [activityId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return { entries, loading, error, refetch: fetchEntries }
}
