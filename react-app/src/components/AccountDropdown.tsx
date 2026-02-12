import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from './Button';
import FormMessage from './FormMessage';
import InputBox from './InputBox';
import AvatarUpload from './AvatarUpload';
import './AccountDropdown.css';

interface AccountDropdownProps {
  onClose: () => void;
  onSignOut: () => void;
}

export default function AccountDropdown({ onClose: _onClose, onSignOut }: AccountDropdownProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      <FormMessage type="error" message={error} />
      <FormMessage type="success" message={success} />
      <AvatarUpload
        previewUrl={profile?.avatar_url || ''}
        onFileSelect={setAvatarFile}
        onError={setError}
      />
      <form onSubmit={handleSave}>
        <InputBox
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Display Name"
          maxLength={30}
          required
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
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </form>
      <Button variant="logout" onClick={onSignOut}>Logout</Button>
    </div>
  );
}
