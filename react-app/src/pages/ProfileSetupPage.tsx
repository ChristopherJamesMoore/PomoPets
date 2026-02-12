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
  const [age, setAge] = useState('');
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
            placeholder="Display Name"
            required
            maxLength={30}
          />
          <InputBox
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="Age"
            min={5}
            max={120}
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
