import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { AdminUser } from './UsersTable'

interface StudySession { id: string; title: string; coins_earned: number; finished_at: string | null }
interface CoinTx       { id: string; amount: number; transaction_type: string; note: string | null; created_at: string }

interface UserEditPanelProps {
  user:      AdminUser | null
  onClose:   () => void
  onRefresh: () => void
}

export default function UserEditPanel({ user, onClose, onRefresh }: UserEditPanelProps) {
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl,   setAvatarUrl]   = useState('')
  const [saveMsg,     setSaveMsg]     = useState('')
  const [saving,      setSaving]      = useState(false)

  const [coinDir,    setCoinDir]    = useState<'add' | 'subtract'>('add')
  const [coinAmt,    setCoinAmt]    = useState<number>(0)
  const [coinReason, setCoinReason] = useState('')
  const [coinMsg,    setCoinMsg]    = useState('')
  const [coinBusy,   setCoinBusy]   = useState(false)

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [txns,     setTxns]     = useState<CoinTx[]>([])

  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? '')
    setAvatarUrl(user.avatar_url ?? '')
    setSaveMsg('')
    setCoinMsg('')
    setCoinAmt(0)
    setCoinReason('')

    supabase
      .from('study_sessions')
      .select('id, title, coins_earned, finished_at')
      .eq('user_id', user.id)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setSessions((data as StudySession[]) ?? []))

    supabase
      .from('coin_transactions')
      .select('id, amount, transaction_type, note, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => setTxns((data as CoinTx[]) ?? []))
  }, [user?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), avatar_url: avatarUrl.trim() || null })
      .eq('id', user.id)
    setSaveMsg(error ? `Error: ${error.message}` : 'Saved!')
    setSaving(false)
    if (!error) onRefresh()
  }

  const handleCoinAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coinAmt || coinAmt <= 0) { setCoinMsg('Enter a positive amount.'); return }
    setCoinBusy(true)
    setCoinMsg('')
    const rpc = coinDir === 'add' ? 'earn_coins' : 'spend_coins'
    const { error } = await supabase.rpc(rpc, {
      p_user_id: user.id,
      p_amount:  coinAmt,
      p_type:    'manual_adjustment',
      p_note:    coinReason.trim() || `Admin ${coinDir}`,
    })
    if (error) {
      setCoinMsg(`Error: ${error.message}`)
    } else {
      setCoinMsg(`✓ ${coinDir === 'add' ? 'Added' : 'Removed'} ${coinAmt} coins`)
      setCoinAmt(0)
      setCoinReason('')
      onRefresh()
    }
    setCoinBusy(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <div className="admin-panel-overlay" onClick={onClose} />
      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-user">
            <div className="admin-avatar admin-avatar--lg">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" />
                : <span>{(user.display_name?.[0] ?? '?').toUpperCase()}</span>
              }
            </div>
            <div>
              <div className="admin-panel-username">{user.display_name || 'No name'}</div>
              <div className="admin-panel-email">{user.email ?? '—'}</div>
            </div>
          </div>
          <button className="admin-panel-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Edit Profile ── */}
        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title">Edit Profile</h3>
          <form onSubmit={handleSaveProfile}>
            <div className="admin-form-field" style={{ marginBottom: 10 }}>
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="admin-form-field" style={{ marginBottom: 12 }}>
              <label>Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            {saveMsg && <p className={`admin-inline-msg ${saveMsg.startsWith('Error') ? 'admin-inline-msg--err' : ''}`}>{saveMsg}</p>}
            <button type="submit" className="admin-create-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* ── Coin Adjustment ── */}
        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title">Coin Adjustment <span className="admin-muted" style={{ fontWeight: 400 }}>({user.coins.toLocaleString()} current)</span></h3>
          <form onSubmit={handleCoinAdjust}>
            <div className="admin-coin-adj-row">
              <select
                className="admin-coin-dir"
                value={coinDir}
                onChange={e => setCoinDir(e.target.value as 'add' | 'subtract')}
              >
                <option value="add">+ Add</option>
                <option value="subtract">− Remove</option>
              </select>
              <input
                className="admin-coin-input"
                type="number"
                min={1}
                placeholder="Amount"
                value={coinAmt || ''}
                onChange={e => setCoinAmt(Number(e.target.value))}
                onFocus={e => e.target.select()}
              />
            </div>
            <div className="admin-form-field" style={{ marginBottom: 10, marginTop: 8 }}>
              <label>Reason <span className="admin-optional">optional</span></label>
              <input
                type="text"
                placeholder="e.g. Competition reward"
                value={coinReason}
                onChange={e => setCoinReason(e.target.value)}
                maxLength={120}
              />
            </div>
            {coinMsg && <p className={`admin-inline-msg ${coinMsg.startsWith('Error') ? 'admin-inline-msg--err' : ''}`}>{coinMsg}</p>}
            <button type="submit" className="admin-create-btn" disabled={coinBusy}>
              {coinBusy ? 'Applying…' : 'Apply'}
            </button>
          </form>
        </div>

        {/* ── Study Sessions ── */}
        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title">Recent Study Sessions</h3>
          {sessions.length === 0
            ? <p className="admin-panel-empty">No finished sessions.</p>
            : (
              <table className="admin-table admin-table--compact">
                <thead><tr><th>Title</th><th>Coins</th><th>Date</th></tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>🪙 {s.coins_earned}</td>
                      <td className="admin-muted">{s.finished_at ? formatDate(s.finished_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {/* ── Coin Transactions ── */}
        <div className="admin-panel-section">
          <h3 className="admin-panel-section-title">Coin History</h3>
          {txns.length === 0
            ? <p className="admin-panel-empty">No transactions.</p>
            : (
              <table className="admin-table admin-table--compact">
                <thead><tr><th>Type</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td className="admin-mono">{t.transaction_type}</td>
                      <td style={{ color: t.transaction_type.includes('penalty') || t.transaction_type.includes('purchase') || t.transaction_type.includes('spend') || t.transaction_type.includes('pet_') || t.transaction_type.includes('shop') ? '#c00' : '#080' }}>
                        {t.transaction_type.includes('penalty') || t.transaction_type.includes('purchase') || t.transaction_type.includes('pet_') || t.transaction_type.includes('shop') || t.transaction_type.includes('item') ? '-' : '+'}
                        {t.amount}
                      </td>
                      <td className="admin-muted">{t.note ?? '—'}</td>
                      <td className="admin-muted">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </>
  )
}
