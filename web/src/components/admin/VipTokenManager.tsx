import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface VipToken {
  id:             string
  token:          string
  label:          string
  bonus_coins:    number
  bonus_pet_name: string | null
  max_uses:       number | null
  use_count:      number
  is_active:      boolean
  expires_at:     string | null
  created_at:     string
}

interface VipTokenManagerProps {
  tokens:    VipToken[]
  onRefresh: () => void
}

function generateSlug(label: string): string {
  const base   = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
  const random = Math.random().toString(36).slice(2, 7)
  return `${base}-${random}`
}

const BASE_URL = window.location.origin

export default function VipTokenManager({ tokens, onRefresh }: VipTokenManagerProps) {
  const [label,       setLabel]       = useState('')
  const [bonusCoins,  setBonusCoins]  = useState(500)
  const [bonusPet,    setBonusPet]    = useState('')
  const [maxUses,     setMaxUses]     = useState<string>('')
  const [expiresAt,   setExpiresAt]   = useState('')
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')
  const [copied,      setCopied]      = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) { setCreateError('Label is required.'); return }
    setCreateError('')
    setCreating(true)

    const tokenSlug = generateSlug(label)
    const { error } = await supabase.from('vip_tokens').insert({
      token:          tokenSlug,
      label:          label.trim(),
      bonus_coins:    bonusCoins,
      bonus_pet_name: bonusPet.trim() || null,
      max_uses:       maxUses ? parseInt(maxUses) : null,
      expires_at:     expiresAt || null,
    })

    if (error) { setCreateError(error.message); setCreating(false); return }

    setLabel(''); setBonusCoins(500); setBonusPet(''); setMaxUses(''); setExpiresAt('')
    onRefresh()
    setCreating(false)
  }

  const toggleActive = async (t: VipToken) => {
    await supabase.from('vip_tokens').update({ is_active: !t.is_active }).eq('id', t.id)
    onRefresh()
  }

  const deleteToken = async (id: string) => {
    if (!confirm('Delete this token? Existing entries referencing it are unaffected.')) return
    await supabase.from('vip_tokens').delete().eq('id', id)
    onRefresh()
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/join/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="admin-section">
      {/* Create form */}
      <div className="admin-create-card">
        <h3 className="admin-create-title">Create VIP Token</h3>
        {createError && <p className="admin-form-error">{createError}</p>}
        <form onSubmit={handleCreate} className="admin-create-form">
          <div className="admin-form-row">
            <div className="admin-form-field admin-form-field--grow">
              <label>Label *</label>
              <input
                type="text"
                placeholder="e.g. Pitch Competition 2026"
                value={label}
                onChange={e => setLabel(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="admin-form-field">
              <label>Bonus Coins</label>
              <input
                type="number"
                min={0}
                value={bonusCoins}
                onChange={e => setBonusCoins(Number(e.target.value))}
                onFocus={e => e.target.select()}
              />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-field admin-form-field--grow">
              <label>Bonus Pet Name <span className="admin-optional">optional</span></label>
              <input
                type="text"
                placeholder="e.g. Golden Pup"
                value={bonusPet}
                onChange={e => setBonusPet(e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="admin-form-field">
              <label>Max Uses <span className="admin-optional">optional</span></label>
              <input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                onFocus={e => e.target.select()}
              />
            </div>
            <div className="admin-form-field">
              <label>Expires <span className="admin-optional">optional</span></label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="admin-create-btn" disabled={creating}>
            {creating ? 'Creating…' : '+ Create Token'}
          </button>
        </form>
      </div>

      {/* Token table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Token Slug</th>
              <th>Coins</th>
              <th>Pet</th>
              <th>Uses</th>
              <th>Expires</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 && (
              <tr><td colSpan={8} className="admin-empty">No tokens yet.</td></tr>
            )}
            {tokens.map(t => (
              <tr key={t.id} className={!t.is_active ? 'admin-row--inactive' : ''}>
                <td>{t.label}</td>
                <td className="admin-mono">{t.token}</td>
                <td>{t.bonus_coins}</td>
                <td className="admin-muted">{t.bonus_pet_name ?? '—'}</td>
                <td>{t.use_count}{t.max_uses !== null ? ` / ${t.max_uses}` : ''}</td>
                <td className="admin-muted">
                  {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : '—'}
                </td>
                <td>
                  <button
                    className={`admin-toggle-btn ${t.is_active ? 'admin-toggle-btn--on' : ''}`}
                    onClick={() => toggleActive(t)}
                  >
                    {t.is_active ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="admin-actions">
                  <button className="admin-copy-btn" onClick={() => copyLink(t.token)}>
                    {copied === t.token ? '✓ Copied' : 'Copy Link'}
                  </button>
                  <button className="admin-delete-btn" onClick={() => deleteToken(t.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
