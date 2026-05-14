import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ROLES } from '../lib/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,   setSession]   = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [authError, setAuthError] = useState(null)
  const refreshingRef = useRef(false)

  // ── Fetch profile row ──────────────────────────────────────────────────────
  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, gcc:gcc_id (id, name, company_name, city)')
        .eq('id', userId)
        .single()

      setProfile(error ? null : data)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Safely decode a JWT payload
  function decodeJwt(token) {
    try { return JSON.parse(atob(token.split('.')[1])) }
    catch { return null }
  }

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Safety net — never leave the app stuck on "Loading…" forever
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 6000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(timeout)

        // No session → go to login
        if (!session) {
          setSession(null)
          setProfile(null)
          setLoading(false)
          return
        }

        // On first load: check if JWT has our custom claims.
        // If not, the token was issued before the auth hook — refresh it now.
        if (event === 'INITIAL_SESSION' && !refreshingRef.current) {
          const payload = decodeJwt(session.access_token)
          if (payload && !payload.user_role) {
            refreshingRef.current = true
            const { data, error } = await supabase.auth.refreshSession()
            refreshingRef.current = false

            if (error || !data?.session) {
              // Can't get a valid session — force sign-out
              setSession(null)
              setProfile(null)
              setLoading(false)
              supabase.auth.signOut()
              return
            }

            // Use the refreshed session directly (don't wait for TOKEN_REFRESHED event)
            setSession(data.session)
            await fetchProfile(data.session.user.id)
            return
          }
        }

        // Normal path: set session + load profile
        setSession(session)
        await fetchProfile(session.user.id)
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  // ── Auth actions ───────────────────────────────────────────────────────────

  async function signIn(email, password) {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    return { error }
  }

  async function signOut() {
    // Immediately clear local state so the UI redirects without waiting
    setSession(null)
    setProfile(null)
    setLoading(false)
    // Then invalidate the server session
    try { await supabase.auth.signOut() } catch { /* ignore */ }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const role       = profile?.role || null
  const roleConfig = role ? ROLES[role] : null

  const value = {
    session,
    profile,
    loading,
    authError,
    role,
    gccId:    profile?.gcc_id    || null,
    vendorId: profile?.vendor_id || null,
    canEdit:      roleConfig?.canEdit   || false,
    canDelete:    roleConfig?.canDelete || false,
    canAudit:     roleConfig?.canAudit  || false,
    isGccHead:    role === 'gcc_head',
    isHrHead:     role === 'hr_head',
    isUsHead:     role === 'us_head',
    isVendor:     role === 'vendor',
    signIn,
    signOut,
    refreshProfile: () => session?.user && fetchProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
