import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'

// ── Protected route — redirects to /login if not authenticated ────────────

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        background:     '#09090b',
        height:         '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          '#3f3f46',
        fontFamily:     "'DM Sans','Inter',system-ui,sans-serif",
        fontSize:       13,
      }}>
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

// ── Public route — redirects to / if already authenticated ────────────────

function PublicRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return null

  if (session) {
    return <Navigate to="/" replace />
  }

  return children
}

// ── App root ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
