import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

type FormView = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const { user, loading, isProfileComplete } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<FormView>('login')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate(isProfileComplete ? '/home' : '/profile-setup', { replace: true })
    }
  }, [loading, user, isProfileComplete, navigate])

  const clearMessages = () => { setError(''); setSuccess('') }

  const switchView = (v: FormView) => {
    setView(v)
    setEmail(''); setPassword(''); setConfirm('')
    clearMessages()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setSubmitting(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) { setError(error.message); setSubmitting(false); return }
    if (data.user && !data.session) {
      setSuccess('Check your email to confirm your account!')
      setSubmitting(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) { setError(error.message) }
    else { setSuccess('If that email exists, a reset link has been sent.') }
    setSubmitting(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    })
  }

  return (
    <div className="login-page">
      <Link to="/" className="login-back">← Back</Link>

      <div className="login-card">
        <Link to="/" className="login-logo">
          <img src="/logo.png" alt="PomoPets" />
          <span>PomoPets</span>
        </Link>

        {/* ── Login ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <input className="pill-input" type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="pill-input" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required />

            <button type="button" className="forgot-link" onClick={() => switchView('forgot')}>
              Forgot Password?
            </button>

            <button type="submit" className="pill-btn primary" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Login!'}
            </button>

            <div className="divider"><span>or</span></div>

            <button type="button" className="pill-btn google" onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </button>

            <p className="switch-link">
              Don't have an account?{' '}
              <button type="button" onClick={() => switchView('register')}>Register</button>
            </p>
          </form>
        )}

        {/* ── Register ── */}
        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h2>Register</h2>
            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <input className="pill-input" type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="pill-input" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <input className="pill-input" type="password" placeholder="Confirm Password"
              value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />

            <button type="submit" className="pill-btn primary" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="switch-link">
              Already have an account?{' '}
              <button type="button" onClick={() => switchView('login')}>Login</button>
            </p>
          </form>
        )}

        {/* ── Forgot ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <h2>Reset Password</h2>
            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <input className="pill-input" type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required />

            <button type="submit" className="pill-btn primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p className="switch-link">
              Remember your password?{' '}
              <button type="button" onClick={() => switchView('login')}>Login</button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  )
}
