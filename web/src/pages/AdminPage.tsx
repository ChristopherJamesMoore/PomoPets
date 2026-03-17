import { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AdminStats        from '../components/admin/AdminStats'
import WaitlistTable     from '../components/admin/WaitlistTable'
import VipTokenManager   from '../components/admin/VipTokenManager'
import UsersTable        from '../components/admin/UsersTable'
import UserEditPanel     from '../components/admin/UserEditPanel'
import AuditLogsTable    from '../components/admin/AuditLogsTable'
import PetCatalogManager from '../components/admin/PetCatalogManager'
import TicketsTable      from '../components/admin/TicketsTable'
import type { WaitlistEntry }  from '../components/admin/WaitlistTable'
import type { VipToken }       from '../components/admin/VipTokenManager'
import type { AdminUser }      from '../components/admin/UsersTable'
import type { AuditLog }       from '../components/admin/AuditLogsTable'
import type { SupportTicket }  from '../components/admin/TicketsTable'
import './AdminPage.css'

const ADMIN_SECRET   = import.meta.env.VITE_ADMIN_SECRET   ?? ''
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? ''
const SESSION_KEY    = 'pomopets_admin_auth'

type Tab = 'waitlist' | 'tokens' | 'users' | 'audit' | 'pets' | 'tickets'

export default function AdminPage() {
  const { secret } = useParams<{ secret: string }>()
  if (ADMIN_SECRET && secret !== ADMIN_SECRET) return <Navigate to="/" replace />
  return <AdminInner />
}

function AdminInner() {
  const [authed,     setAuthed]     = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [pwInput,    setPwInput]    = useState('')
  const [pwError,    setPwError]    = useState('')

  const [sbEmail,    setSbEmail]    = useState('')
  const [sbPassword, setSbPassword] = useState('')
  const [sbError,    setSbError]    = useState('')
  const [sbLoading,  setSbLoading]  = useState(false)
  const [sbUser,     setSbUser]     = useState<boolean | null>(null)

  const [tab,          setTab]          = useState<Tab>('waitlist')
  const [entries,      setEntries]      = useState<WaitlistEntry[]>([])
  const [tokens,       setTokens]       = useState<VipToken[]>([])
  const [users,        setUsers]        = useState<AdminUser[]>([])
  const [auditLogs,    setAuditLogs]    = useState<AuditLog[]>([])
  const [tickets,      setTickets]      = useState<SupportTicket[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSbUser(!!session?.user))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: wl }, { data: tk }, { data: us }, { data: al }, { data: st }] = await Promise.all([
      supabase.from('waitlist_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('vip_tokens').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, email, avatar_url, coins, created_at').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*, profiles(display_name, email)').order('created_at', { ascending: false }).limit(500),
      supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
    ])
    setEntries((wl  as WaitlistEntry[]) ?? [])
    setTokens((tk   as VipToken[])      ?? [])
    setUsers((us    as AdminUser[])     ?? [])
    setAuditLogs((al as AuditLog[])     ?? [])
    setTickets((st   as SupportTicket[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { if (authed && sbUser) fetchData() }, [authed, sbUser, fetchData])

  // ── Password gate ───────────────────────────────────────────────────────────
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ADMIN_PASSWORD || pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthed(true)
    } else {
      setPwError('Incorrect password.')
    }
  }

  // ── Supabase login ──────────────────────────────────────────────────────────
  const handleSbLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSbError('')
    setSbLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: sbEmail.trim(), password: sbPassword,
    })
    if (error) { setSbError(error.message); setSbLoading(false) }
    else setSbUser(true)
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <form className="admin-gate-form" onSubmit={handlePasswordSubmit}>
          <h1 className="admin-gate-title">PomoPets Admin</h1>
          {pwError && <p className="admin-gate-error">{pwError}</p>}
          <input className="admin-gate-input" type="password" placeholder="Admin password"
            value={pwInput} onChange={e => setPwInput(e.target.value)} autoFocus />
          <button type="submit" className="admin-gate-btn">Enter</button>
        </form>
      </div>
    )
  }

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
          <input className="admin-gate-input" type="email" placeholder="Email"
            value={sbEmail} onChange={e => setSbEmail(e.target.value)} required autoFocus />
          <input className="admin-gate-input" type="password" placeholder="Password"
            value={sbPassword} onChange={e => setSbPassword(e.target.value)} required />
          <button type="submit" className="admin-gate-btn" disabled={sbLoading}>
            {sbLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

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
        <button className="admin-logout-btn" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}>
          Lock Panel
        </button>
      </header>

      <main className="admin-main">
        <AdminStats total={total} general={general} vip={vip} tokens={activeTokens} users={users.length} />

        <div className="admin-tabs">
          {(['waitlist', 'tokens', 'users', 'audit', 'pets', 'tickets'] as Tab[]).map(t => {
            const labels: Record<Tab, string> = {
              waitlist: 'Waitlist', tokens: 'VIP Tokens', users: 'Users', audit: 'Audit Logs', pets: 'Pets', tickets: 'Tickets',
            }
            const counts: Record<Tab, number> = {
              waitlist: total, tokens: tokens.length, users: users.length, audit: auditLogs.length, pets: 0, tickets: tickets.length,
            }
            return (
              <button
                key={t}
                className={`admin-tab-btn ${tab === t ? 'admin-tab-btn--active' : ''}`}
                onClick={() => setTab(t)}
              >
                {labels[t]} <span className="admin-tab-count">{counts[t]}</span>
              </button>
            )
          })}
          <button className="admin-refresh-btn" onClick={fetchData} disabled={loading}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {tab === 'waitlist' && <WaitlistTable entries={entries} onRefresh={fetchData} />}
        {tab === 'tokens'   && <VipTokenManager tokens={tokens} onRefresh={fetchData} />}
        {tab === 'users'    && (
          <UsersTable
            users={users}
            selectedId={selectedUser?.id ?? null}
            onSelectUser={setSelectedUser}
          />
        )}
        {tab === 'audit'    && <AuditLogsTable logs={auditLogs} onRefresh={fetchData} />}
        {tab === 'pets'     && <PetCatalogManager />}
        {tab === 'tickets'  && <TicketsTable tickets={tickets} onRefresh={fetchData} />}
      </main>

      <UserEditPanel
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRefresh={fetchData}
      />
    </div>
  )
}
