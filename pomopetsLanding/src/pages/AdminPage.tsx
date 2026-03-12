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

  // ── Gate 1: secret URL slug ────────────────────────────────────────────────
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return <Navigate to="/" replace />
  }

  return <AdminInner />
}

function AdminInner() {
  const [authed,   setAuthed]   = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [pwInput,  setPwInput]  = useState('')
  const [pwError,  setPwError]  = useState('')

  const [tab,      setTab]      = useState<Tab>('waitlist')
  const [entries,  setEntries]  = useState<WaitlistEntry[]>([])
  const [tokens,   setTokens]   = useState<VipToken[]>([])
  const [loading,  setLoading]  = useState(false)

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
    if (authed) fetchData()
  }, [authed, fetchData])

  // ── Gate 2: password ────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthed(true)
    } else {
      setPwError('Incorrect password.')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
    setPwInput('')
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-form" onSubmit={handleLogin}>
          <h1 className="admin-gate-title">PomoPets Admin</h1>
          {pwError && <p className="admin-gate-error">{pwError}</p>}
          <input
            className="admin-gate-input"
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="admin-gate-btn">Enter</button>
        </form>
      </div>
    )
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total   = entries.length
  const general = entries.filter(e => e.source === 'general').length
  const vip     = entries.filter(e => e.source === 'vip').length
  const activeTokens = tokens.filter(t => t.is_active).length

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-brand">PomoPets</span>
          <span className="admin-header-sub">Admin Panel</span>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout}>Sign Out</button>
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

        {tab === 'waitlist' && (
          <WaitlistTable entries={entries} onRefresh={fetchData} />
        )}
        {tab === 'tokens' && (
          <VipTokenManager tokens={tokens} onRefresh={fetchData} />
        )}
      </main>
    </div>
  )
}
