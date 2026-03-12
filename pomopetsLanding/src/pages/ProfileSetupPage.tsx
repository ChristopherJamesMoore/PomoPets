import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AvatarUpload from '../components/AvatarUpload'
import './LoginPage.css'
import './ProfileSetupPage.css'

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null)
  const [error, setError]             = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    const trimmed = displayName.trim()
    if (!trimmed) { setError('Display name is required.'); return }
    if (trimmed.length < 2) { setError('Display name must be at least 2 characters.'); return }
    if (trimmed.length > 30) { setError('Display name must be 30 characters or less.'); return }

    setSubmitting(true)

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: trimmed,
        avatar_url: avatarUrl,
        display_name_changed_at: new Date().toISOString(),
      })

    if (upsertError) {
      setError(upsertError.message)
      setSubmitting(false)
      return
    }

    await refreshProfile()
    navigate('/home', { replace: true })
  }

  if (!user) return null

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="PomoPets" />
          <span>PomoPets</span>
        </div>

        <form onSubmit={handleSubmit}>
          <h2>Set Up Your Profile</h2>
          <p className="setup-subtitle">Choose how you'll appear in the game!</p>

          {error && <p className="form-error">{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AvatarUpload
              userId={user.id}
              currentUrl={avatarUrl}
              onUploaded={setAvatarUrl}
            />
          </div>

          <label className="field-label">Display Name *</label>
          <input
            className="pill-input"
            type="text"
            placeholder="e.g. TrainerAlex"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={30}
            required
            autoFocus
          />
          <p className="field-hint">{displayName.trim().length}/30 characters</p>

          <button type="submit" className="pill-btn primary" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Saving…' : "Let's Go! 🐾"}
          </button>
        </form>
      </div>
    </div>
  )
}
