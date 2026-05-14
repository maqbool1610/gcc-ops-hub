import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, authError, loading } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (!error) navigate('/')
  }

  return (
    <div style={{
      background:     '#0a0c15',
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     "'DM Sans','Inter',system-ui,sans-serif",
      padding:        16,
    }}>
      <style>{`
        .login-input {
          width: 100%;
          background: #161a28;
          border: 1px solid #27272a;
          color: #e4e4e7;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }
        .login-input:focus {
          border-color: #3b82f6;
        }
        .login-input::placeholder {
          color: #3f3f46;
        }
        .login-btn {
          width: 100%;
          background: #3b82f6;
          border: none;
          color: white;
          border-radius: 8px;
          padding: 11px 0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s ease;
          letter-spacing: 0.01em;
        }
        .login-btn:hover:not(:disabled) {
          background: #2563eb;
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 360, padding: '0 4px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width:          46,
            height:         46,
            borderRadius:   13,
            background:     '#1d4ed8',
            border:         '1px solid #3b82f655',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 14px',
          }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>G</span>
          </div>
          <div style={{ color: '#f0f0f2', fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em' }}>
            GCC Ops Hub
          </div>
          <div style={{ color: '#52525b', fontSize: 13, marginTop: 5, fontStyle: 'italic' }}>
            The mirror that makes the invisible visible.
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:   '#10131e',
          border:       '1px solid #1c2238',
          borderRadius: 14,
          padding:      '28px 24px',
        }}>
          <h2 style={{ color: '#f0f0f2', fontSize: 16, fontWeight: 600, margin: '0 0 22px' }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <div style={{
                background:   '#1f0a0a',
                border:       '1px solid #4a1515',
                borderRadius: 8,
                padding:      '9px 12px',
                color:        '#f87171',
                fontSize:     12,
                marginBottom: 16,
                lineHeight:   1.5,
              }}>
                {authError}
              </div>
            )}

            <button
              className="login-btn"
              type="submit"
              disabled={busy || loading}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{
          textAlign: 'center',
          color:     '#3f3f46',
          fontSize:  11,
          marginTop: 22,
          lineHeight: 1.6,
        }}>
          Access is by invitation only.<br />Contact your GCC Head to get access.
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display:      'block',
  color:        '#71717a',
  fontSize:     11,
  marginBottom: 6,
  letterSpacing: '0.02em',
}
