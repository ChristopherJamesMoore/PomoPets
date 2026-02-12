import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './AccountDropdown.css';

interface Props {
  onClose: () => void;
  onSignOut: () => void;
}

export default function AccountDropdown({ onClose: _onClose, onSignOut }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setSaving(true);

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
      display_name: displayName.trim(),
      age: age ? parseInt(age) : null,
    };
    if (avatarUrl) profileData.avatar_url = avatarUrl;

    const { error: profileError } = await supabase.from('profiles').upsert(profileData);
    if (profileError) {
      setError('Failed to save: ' + profileError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSuccess('Saved!');
    setSaving(false);
    setAvatarFile(null);
  };

  return (
    <div className="account-dropdown glass-card">
      <h3>Edit Profile</h3>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}
      <div className="dropdown-avatar" onClick={() => fileInputRef.current?.click()}>
        {avatarPreview ? (
          <img src={avatarPreview} alt="Avatar" />
        ) : (
          <span>+</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
      </div>
      <form onSubmit={handleSave}>
        <div className="input-box">
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Display Name"
            maxLength={30}
            required
          />
        </div>
        <div className="input-box">
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="Age"
            min={5}
            max={120}
          />
        </div>
        <button type="submit" className="btn-login" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
      <button className="btn-logout" onClick={onSignOut}>Logout</button>
    </div>
  );
}
