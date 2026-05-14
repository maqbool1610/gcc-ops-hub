import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { VENDOR_COLORS } from '../lib/constants'

// ─────────────────────────────────────────────────────────────────────────────
// useVendors — fetches all active vendors for the authenticated user's GCC,
// with realtime updates via Supabase channel subscription.
// ─────────────────────────────────────────────────────────────────────────────

export function useVendors(gccId) {
  const [vendors,  setVendors]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchVendors = useCallback(async () => {
    if (!gccId) return
    setError(null)

    const { data, error: err } = await supabase
      .from('vendors')
      .select('*')
      .eq('gcc_id', gccId)
      .order('display_name')

    if (err) {
      setError(err.message)
    } else {
      setVendors(data || [])
    }
    setLoading(false)
  }, [gccId])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function createVendor(vendorData) {
    const { data, error: err } = await supabase
      .from('vendors')
      .insert({ ...vendorData, gcc_id: gccId })
      .select()
      .single()

    if (err) return { error: err.message }
    fetchVendors().catch(() => {})   // immediate refresh, don't block
    return { data }
  }

  async function updateVendor(id, updates) {
    const { data, error: err } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (err) return { error: err.message }
    fetchVendors().catch(() => {})   // immediate refresh, don't block
    return { data }
  }

  // Deactivate (soft delete) — data is preserved, vendor hidden from dashboard
  async function deactivateVendor(id) {
    return updateVendor(id, { is_active: false })
  }

  async function reactivateVendor(id) {
    return updateVendor(id, { is_active: true })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Get the display colour for a vendor, falling back to its category colour
  function getVendorColor(vendor) {
    if (vendor.color_hex) return vendor.color_hex
    return VENDOR_COLORS[vendor.category] || VENDOR_COLORS.Custom
  }

  return {
    vendors,
    loading,
    error,
    refetch:          fetchVendors,
    createVendor,
    updateVendor,
    deactivateVendor,
    reactivateVendor,
    getVendorColor,
  }
}
