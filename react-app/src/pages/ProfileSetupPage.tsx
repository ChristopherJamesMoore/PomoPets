import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import FormMessage from '../components/FormMessage';
import InputBox from '../components/InputBox';
import AvatarUpload from '../components/AvatarUpload';
import './ProfileSetupPage.css';

export default function ProfileSetupPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Username is required.');
      setSaving(false);
      return;
    }

    // Check uniqueness
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

    let avatarUrl: string | null = null;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const buffer = await avatarFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, { upsert: true, contentType: avatarFile.type });
      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        // Don't block profile creation — save without avatar
      } else {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      }
    }

    const profileData: Record<string, unknown> = {
      id: user.id,
      display_name: trimmedName,
      display_name_changed_at: new Date().toISOString(),
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
        <FormMessage type="error" message={error} />

        <AvatarUpload
          previewUrl=""
          onFileSelect={setAvatarFile}
          onError={setError}
        />

        <form onSubmit={handleSubmit}>
          <InputBox
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Choose a username"
            required
            maxLength={30}
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
