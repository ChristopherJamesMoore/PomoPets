import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminStats      from '../components/admin/AdminStats'
import WaitlistTable   from '../components/admin/WaitlistTable'
import VipTokenManager from '../components/admin/VipTokenManager'
import type { WaitlistEntry } from '../components/admin/WaitlistTable'
import type { VipToken }      from '../components/admin/VipTokenManager'
import './AdminPage.css'

const ADMIN_SECRET   = import.meta.env.VITE_ADMIN_SECRET   ?? ''
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? ''
const SESSION_KEY    = 'pomopets_admin_auth'

type Tab = 'waitlist' | 'tokens'

export default function AdminPage() {
  const { secret } = useParams<{ secret: string }>()

  // Gate 1: secret URL slug — only redirect if ADMIN_SECRET is actually configured
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) {
    return <Navigate to="/" replace />
  }

  return <AdminInner />
}

function AdminInner() {
  // Gate 2: password
  const [authed,  setAuthed]  = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')

  // Gate 3: Supabase login (needed for authenticated RLS)
  const [sbEmail,    setSbEmail]    = useState('')
  const [sbPassword, setSbPassword] = useState('')
  const [sbError,    setSbError]    = useState('')
  const [sbLoading,  setSbLoading]  = useState(false)
  const [sbUser,     setSbUser]     = useState<boolean | null>(null) // null = checking

  const [tab,     setTab]     = useState<Tab>('waitlist')
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [tokens,  setTokens]  = useState<VipToken[]>([])
  const [loading, setLoading] = useState(false)

  // Check if already logged in to Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSbUser(!!session?.user)
    })
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: wl }, { data: tk }] = await Promise.all([
      supabase.from('waitlist_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('vip_tokens').select('*').order('created_at', { ascending: false }),
    ])
    setEntries((wl as WaitlistEntry[]) ?? [])
    setTokens((tk as VipToken[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed && sbUser) fetchData()
  }, [authed, sbUser, fetchData])

  // ── Gate 2: Password ────────────────────────────────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ADMIN_PASSWORD || pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthed(true)
    } else {
      setPwError('Incorrect password.')
    }
  }

  // ── Gate 3: Supabase login ──────────────────────────────────────────────────
  const handleSbLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSbError('')
    setSbLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: sbEmail.trim(),
      password: sbPassword,
    })
    if (error) {
      setSbError(error.message)
      setSbLoading(false)
    } else {
      setSbUser(true)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
    setPwInput('')
  }

  // ── Gate 2: password screen ─────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-form" onSubmit={handlePasswordSubmit}>
          <h1 className="admin-gate-title">PomoPets Admin</h1>
          {pwError && <p className="admin-gate-error">{pwError}</p>}
          <input
            className="admin-gate-input"
            type="password"
            placeholder="Admin password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="admin-gate-btn">Enter</button>
        </form>
      </div>
    )
  }

  // ── Gate 3: Supabase login screen ───────────────────────────────────────────
  if (sbUser === null) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-form">
          <p style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>Checking session…</p>
        </div>
      </div>
    )
  }

  if (!sbUser) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-form" onSubmit={handleSbLogin}>
          <h1 className="admin-gate-title">Sign In</h1>
          <p className="admin-gate-sub">Sign in with your PomoPets account to load data.</p>
          {sbError && <p className="admin-gate-error">{sbError}</p>}
          <input
            className="admin-gate-input"
            type="email"
            placeholder="Email"
            value={sbEmail}
            onChange={e => setSbEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className="admin-gate-input"
            type="password"
            placeholder="Password"
            value={sbPassword}
            onChange={e => setSbPassword(e.target.value)}
            required
          />
          <button type="submit" className="admin-gate-btn" disabled={sbLoading}>
            {sbLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  // ── Dashboard ───────────────────────────────────────────────────────────────
  const total        = entries.length
  const general      = entries.filter(e => e.source === 'general').length
  const vip          = entries.filter(e => e.source === 'vip').length
  const activeTokens = tokens.filter(t => t.is_active).length

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-brand">PomoPets</span>
          <span className="admin-header-sub">Admin Panel</span>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>Lock Panel</button>
      </header>

      <main className="admin-main">
        <AdminStats total={total} general={general} vip={vip} tokens={activeTokens} />

        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${tab === 'waitlist' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setTab('waitlist')}
          >
            Waitlist <span className="admin-tab-count">{total}</span>
          </button>
          <button
            className={`admin-tab-btn ${tab === 'tokens' ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setTab('tokens')}
          >
            VIP Tokens <span className="admin-tab-count">{tokens.length}</span>
          </button>
          <button className="admin-refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {tab === 'waitlist' && <WaitlistTable entries={entries} onRefresh={fetchData} />}
        {tab === 'tokens'   && <VipTokenManager tokens={tokens} onRefresh={fetchData} />}
      </main>
    </div>
  )
}
