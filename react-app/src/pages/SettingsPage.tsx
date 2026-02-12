import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import FormMessage from '../components/FormMessage';
import InputBox from '../components/InputBox';
import AvatarUpload from '../components/AvatarUpload';
import './SettingsPage.css';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function canChangeName(changedAt: string | null): boolean {
  if (!changedAt) return true;
  return Date.now() - new Date(changedAt).getTime() >= THIRTY_DAYS_MS;
}

function daysUntilChange(changedAt: string | null): number {
  if (!changedAt) return 0;
  const elapsed = Date.now() - new Date(changedAt).getTime();
  const remaining = THIRTY_DAYS_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const nameAllowed = canChangeName(profile?.display_name_changed_at ?? null);
  const nameChanged = displayName.trim() !== (profile?.display_name || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setSaving(true);

    const trimmedName = displayName.trim();

    // Check 30-day limit if name is changing
    if (nameChanged && !nameAllowed) {
      setError(`You can change your username again in ${daysUntilChange(profile?.display_name_changed_at ?? null)} days.`);
      setSaving(false);
      return;
    }

    // Check uniqueness if name is changing
    if (nameChanged && trimmedName) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('display_name', trimmedName)
        .neq('id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setError('That username is already taken.');
        setSaving(false);
        return;
      }
    }

    // Upload avatar if changed
    let avatarUrl = profile?.avatar_url || null;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
      if (uploadError) {
        setError('Avatar upload failed: ' + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }

    const profileData: Record<string, unknown> = {
      id: user.id,
      display_name: trimmedName || profile?.display_name,
    };
    if (avatarUrl) profileData.avatar_url = avatarUrl;
    if (nameChanged && trimmedName) {
      profileData.display_name_changed_at = new Date().toISOString();
    }

    const { error: profileError } = await supabase.from('profiles').upsert(profileData);
    if (profileError) {
      setError('Failed to save: ' + profileError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess('Settings saved!');
    setSaving(false);
    setAvatarFile(null);
  };

  return (
    <div className="settings-page">
      <GlassCard className="settings-card">
        <h1>Account Settings</h1>
        <FormMessage type="error" message={error} />
        <FormMessage type="success" message={success} />

        <AvatarUpload
          previewUrl={profile?.avatar_url || ''}
          onFileSelect={setAvatarFile}
          onError={setError}
          label="Change Avatar"
        />

        <form onSubmit={handleSave}>
          <div className="settings-field">
            <label>Username</label>
            {nameAllowed ? (
              <InputBox
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Username"
                maxLength={30}
                required
              />
            ) : (
              <div className="name-locked">
                <p className="locked-value">{profile?.display_name}</p>
                <p className="locked-hint">
                  You can change your username in {daysUntilChange(profile?.display_name_changed_at ?? null)} days
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
