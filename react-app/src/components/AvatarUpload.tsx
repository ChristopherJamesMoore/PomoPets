import { useRef, useState } from 'react';
import '../pages/ProfileSetupPage.css';

interface AvatarUploadProps {
  previewUrl: string;
  onFileSelect: (file: File) => void;
  onError?: (message: string) => void;
  label?: string;
}

export default function AvatarUpload({ previewUrl, onFileSelect, onError, label = 'Upload Avatar' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState(previewUrl);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onError?.('Image must be under 2MB.');
      return;
    }
    onFileSelect(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLocalPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const preview = localPreview || previewUrl;

  return (
    <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
      <div className="avatar-preview">
        {preview ? (
          <img src={preview} alt="Avatar" />
        ) : (
          <span>+</span>
        )}
      </div>
      <p className="avatar-label">{label}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
