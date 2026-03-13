import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './VipJoinPage.css'

interface VipToken {
  id: string
  token: string
  label: string
  bonus_coins: number
  bonus_pet_name: string | null
  max_uses: number | null
  use_count: number
  is_active: boolean
  expires_at: string | null
}

type PageState = 'loading' | 'invalid' | 'form' | 'success'

export default function VipJoinPage() {
  const { token } = useParams<{ token: string }>()

  const [vipToken,  setVipToken]  = useState<VipToken | null>(null)
  const [pageState, setPageState] = useState<PageState>('loading')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [error,     setError]     = useState('')
  const [submitting,setSubmitting]= useState(false)

  useEffect(() => {
    if (!token) { setPageState('invalid'); return }

    supabase
      .from('vip_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setPageState('invalid'); return }
        const t = data as VipToken
        if (t.expires_at && new Date(t.expires_at) < new Date()) { setPageState('invalid'); return }
        if (t.max_uses !== null && t.use_count >= t.max_uses) { setPageState('invalid'); return }
        setVipToken(t)
        setPageState('form')
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vipToken || !email.trim()) return
    setError('')
    setSubmitting(true)

    const { error: insertErr } = await supabase
      .from('waitlist_entries')
      .insert({
        email:     email.trim().toLowerCase(),
        name:      name.trim() || null,
        source:    'vip',
        vip_token: token,
      })

    if (insertErr) {
      if (insertErr.code === '23505') setError('That email is already registered!')
      else setError(insertErr.message)
      setSubmitting(false)
      return
    }

    // Increment use count
    await supabase
      .from('vip_tokens')
      .update({ use_count: vipToken.use_count + 1 })
      .eq('id', vipToken.id)

    setPageState('success')
    setSubmitting(false)
  }

  if (pageState === 'loading') {
    return (
      <div className="vip-page vip-page--center">
        <span className="vip-paw-spin">🐾</span>
      </div>
    )
  }

  if (pageState === 'invalid') {
    return (
      <div className="vip-page vip-page--center">
        <div className="vip-invalid-card">
          <span style={{ fontSize: 48 }}>🔒</span>
          <h2>This link is invalid or has expired.</h2>
          <p>Please check the link you were given, or join the general waitlist.</p>
          <Link to="/waitlist" className="vip-link-btn">Join Waitlist</Link>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="vip-page vip-page--center">
        <div className="vip-success-card">
          <span className="vip-success-icon">🌟</span>
          <h2>You're in!</h2>
          <p>
            Your VIP spot is reserved. On launch day you'll receive{' '}
            <strong>{vipToken?.bonus_coins} bonus coins</strong>
            {vipToken?.bonus_pet_name && (
              <> and your exclusive <strong>{vipToken.bonus_pet_name}</strong> pet</>
            )}.
          </p>
          <p className="vip-success-sub">We'll email you when the time comes.</p>
          <Link to="/" className="vip-link-btn">Back to PomoPets</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="vip-page">
      <div className="vip-card">
        {/* Header */}
        <div className="vip-header">
          <Link to="/" className="vip-logo">
            <img src="/logo.png" alt="PomoPets" />
            <span>PomoPets</span>
          </Link>
          <span className="vip-badge">⭐ VIP Access</span>
        </div>

        <h1 className="vip-title">You've been invited</h1>
        <p className="vip-label-tag">{vipToken!.label}</p>

        {/* Perks */}
        <div className="vip-perks">
          <div className="vip-perk">
            <span className="vip-perk-icon">🪙</span>
            <div>
              <div className="vip-perk-value">{vipToken!.bonus_coins} Bonus Coins</div>
              <div className="vip-perk-desc">Credited to your account on launch day</div>
            </div>
          </div>
          {vipToken!.bonus_pet_name && (
            <div className="vip-perk">
              <span className="vip-perk-icon">🐾</span>
              <div>
                <div className="vip-perk-value">Exclusive Pet: {vipToken!.bonus_pet_name}</div>
                <div className="vip-perk-desc">A unique pet available only to VIP members</div>
              </div>
            </div>
          )}
          <div className="vip-perk">
            <span className="vip-perk-icon">📣</span>
            <div>
              <div className="vip-perk-value">Early Access Updates</div>
              <div className="vip-perk-desc">First to know when we launch</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="vip-form-section">
          {error && <p className="vip-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <label className="vip-label">Your Name <span className="vip-optional">optional</span></label>
            <input
              className="vip-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
            />

            <label className="vip-label">Email *</label>
            <input
              className="vip-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />

            <button type="submit" className="vip-submit-btn" disabled={submitting}>
              {submitting ? 'Claiming…' : 'Claim My VIP Spot ⭐'}
            </button>
          </form>

          <p className="vip-privacy">No spam. Your details are only used to apply your perks on launch.</p>
        </div>
      </div>
    </div>
  )
}
