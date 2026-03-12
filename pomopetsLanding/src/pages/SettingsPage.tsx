import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
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
  const { profile, refreshProfile, signOut } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [avatarUrl, setAvatarUrl]     = useState(profile?.avatar_url ?? '')
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
    const trimmedAvatar = avatarUrl.trim()

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
      avatar_url: trimmedAvatar || null,
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
      await refreshProfile()
      setSuccess('Profile updated!')
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!profile) {
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

        {/* Avatar preview */}
        <div className="avatar-row">
          <div className="avatar-circle">
            {(avatarUrl.trim() || profile.avatar_url) ? (
              <img
                src={avatarUrl.trim() || profile.avatar_url!}
                alt="Avatar"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <span className="avatar-fallback">{profile.display_name[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="avatar-input-wrap">
            <label className="field-label-sm">Avatar URL <span className="optional-tag">optional</span></label>
            <input
              className="pill-input-sm"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
            />
          </div>
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

      {/* ── Account section ── */}
      <div className="settings-card">
        <h2 className="settings-section-title">Account</h2>
        <p className="settings-account-email">{profile.id && '✉️  Manage your account via the email you signed up with.'}</p>
        <button className="settings-signout-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
