import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import './ProfileSetupPage.css';

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Display name is required.');
      setSaving(false);
      return;
    }

    let avatarUrl: string | null = null;

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
      display_name: trimmedName,
      age: age ? parseInt(age) : null,
    };
    if (avatarUrl) profileData.avatar_url = avatarUrl;

    const { error: profileError } = await supabase.from('profiles').upsert(profileData);
    if (profileError) {
      setError('Failed to save profile: ' + profileError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    navigate('/');
  };

  return (
    <div className="login-page">
      <GlassCard className="wrapper">
        <h1>Set Up Your Profile</h1>
        {error && <div className="form-error">{error}</div>}

        <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
          <div className="avatar-preview">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" />
            ) : (
              <span>+</span>
            )}
          </div>
          <p className="avatar-label">Upload Avatar</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Display Name"
              required
              maxLength={30}
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
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
