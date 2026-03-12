import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './WaitlistPage.css'

export default function WaitlistPage() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email is required.'); return }

    setLoading(true)
    const { error: err } = await supabase
      .from('waitlist_entries')
      .insert({ email: email.trim().toLowerCase(), name: name.trim() || null, source: 'general' })

    if (err) {
      if (err.code === '23505') setError('That email is already on the waitlist!')
      else setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="waitlist-page">
      <Link to="/" className="waitlist-back">← Back</Link>

      <div className="waitlist-card">
        <Link to="/" className="waitlist-logo">
          <img src="/logo.png" alt="PomoPets" />
          <span>PomoPets</span>
        </Link>

        {success ? (
          <div className="waitlist-success">
            <span className="waitlist-success-icon">🐾</span>
            <h2>You're on the list!</h2>
            <p>We'll send updates on launches, early access, and new features straight to your inbox.</p>
            <Link to="/" className="waitlist-home-btn">Back to Home</Link>
          </div>
        ) : (
          <>
            <h2 className="waitlist-title">Join the Waitlist</h2>
            <p className="waitlist-subtitle">
              Be the first to know when PomoPets launches — early members get exclusive perks.
            </p>

            {error && <p className="waitlist-error">{error}</p>}

            <form onSubmit={handleSubmit}>
              <label className="waitlist-label">Name <span className="waitlist-optional">(optional)</span></label>
              <input
                className="waitlist-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
              />

              <label className="waitlist-label">Email *</label>
              <input
                className="waitlist-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />

              <button type="submit" className="waitlist-btn" disabled={loading}>
                {loading ? 'Joining…' : 'Join Waitlist 🐾'}
              </button>
            </form>

            <p className="waitlist-privacy">No spam. Unsubscribe any time.</p>
          </>
        )}
      </div>
    </div>
  )
}
