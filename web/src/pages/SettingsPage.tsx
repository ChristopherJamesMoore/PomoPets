import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logEvent } from '../lib/auditLog'
import AvatarUpload from '../components/AvatarUpload'
import './SettingsPage.css'

const NAME_COOLDOWN_DAYS = 30

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(profile?.avatar_url ?? null)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [saving, setSaving]           = useState(false)

  const daysSinceNameChange = daysSince(profile?.display_name_changed_at ?? null)
  const canChangeName = daysSinceNameChange === null || daysSinceNameChange >= NAME_COOLDOWN_DAYS
  const daysUntilChange = canChangeName ? 0 : NAME_COOLDOWN_DAYS - (daysSinceNameChange ?? 0)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setError('')
    setSuccess('')

    const trimmedName = displayName.trim()
    if (!trimmedName) { setError('Display name cannot be empty.'); return }
    if (trimmedName.length < 2) { setError('Display name must be at least 2 characters.'); return }
    if (trimmedName.length > 30) { setError('Display name must be 30 characters or less.'); return }

    const nameChanged = trimmedName !== profile.display_name

    if (nameChanged && !canChangeName) {
      setError(`You can change your display name again in ${daysUntilChange} day${daysUntilChange !== 1 ? 's' : ''}.`)
      return
    }

    setSaving(true)

    const updates: Record<string, string | null> = {
      display_name: trimmedName,
      avatar_url: avatarUrl,
    }

    if (nameChanged) {
      updates.display_name_changed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      logEvent(profile.id, 'profile.updated', { name_changed: nameChanged })
      await refreshProfile()
      setSuccess('Profile updated!')
    }

    setSaving(false)
  }

  if (!profile || !user) {
    return (
      <div className="settings-loading">
        <span className="loading-paw">🐾</span>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Profile &amp; Settings</h1>

      {/* ── Stats strip ── */}
      <div className="settings-stats">
        <div className="stat-chip">
          <span className="stat-chip-icon">🪙</span>
          <div>
            <div className="stat-chip-value">{profile.coins.toLocaleString()}</div>
            <div className="stat-chip-label">Coins</div>
          </div>
        </div>
        <div className="stat-chip">
          <span className="stat-chip-icon">📅</span>
          <div>
            <div className="stat-chip-value">{formatDate(profile.created_at)}</div>
            <div className="stat-chip-label">Member Since</div>
          </div>
        </div>
      </div>

      {/* ── Edit form ── */}
      <form className="settings-card" onSubmit={handleSave}>
        <h2 className="settings-section-title">Edit Profile</h2>

        {error   && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {/* Avatar upload */}
        <div className="settings-avatar-row">
          <AvatarUpload
            userId={user.id}
            currentUrl={avatarUrl}
            onUploaded={url => { setAvatarUrl(url); setSuccess('') }}
          />
          <p className="settings-avatar-hint">Click your avatar to upload a new photo</p>
        </div>

        {/* Display name */}
        <label className="field-label-sm">
          Display Name
          {!canChangeName && (
            <span className="cooldown-badge">Changes in {daysUntilChange}d</span>
          )}
        </label>
        <input
          className="pill-input-sm"
          type="text"
          placeholder="Your display name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={30}
          disabled={!canChangeName}
        />
        <p className="field-hint-sm">
          {canChangeName
            ? `${displayName.trim().length}/30 characters`
            : `Last changed ${daysSinceNameChange} day${daysSinceNameChange !== 1 ? 's' : ''} ago — cooldown is ${NAME_COOLDOWN_DAYS} days`
          }
        </p>

        <button type="submit" className="settings-save-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* ── Appearance ── */}
      <div className="settings-card">
        <h2 className="settings-section-title">Appearance</h2>
        <div className="settings-theme-options">
          {([
            { id: 'rose', name: 'Rose', desc: 'Warm & cosy', bg: '#fdf6ee', surface: '#ffffff' },
            { id: 'snow', name: 'Snow', desc: 'Clean & bright', bg: '#ffffff', surface: '#fdf6ee' },
          ] as const).map(t => (
            <button
              key={t.id}
              type="button"
              className={`settings-theme-option${profile.theme === t.id ? ' settings-theme-option--active' : ''}`}
              onClick={async () => {
                document.documentElement.setAttribute('data-theme', t.id)
                await supabase.from('profiles').update({ theme: t.id }).eq('id', profile.id)
                await refreshProfile()
              }}
            >
              <div className="settings-theme-swatch">
                <div className="settings-theme-swatch-half" style={{ background: t.bg }} />
                <div className="settings-theme-swatch-half" style={{ background: t.surface }} />
              </div>
              <span className="settings-theme-name">{t.name}</span>
              <span className="settings-theme-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Account section ── */}
      <div className="settings-card">
        <h2 className="settings-section-title">Account</h2>
        <p className="settings-account-email">✉️  Manage your account via the email you signed up with.</p>
        <button className="settings-signout-btn" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
