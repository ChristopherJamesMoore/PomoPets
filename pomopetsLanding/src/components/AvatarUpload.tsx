import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AvatarUpload.css'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  onUploaded: (url: string) => void
}

export default function AvatarUpload({ userId, currentUrl, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }

    setError('')
    setUploading(true)

    const ext  = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    onUploaded(data.publicUrl)
    setUploading(false)
  }

  const displayUrl = currentUrl ?? null

  return (
    <div className="avatar-upload">
      <button
        type="button"
        className="avatar-upload-circle"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Click to change photo"
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="avatar-upload-img" />
        ) : (
          <span className="avatar-upload-placeholder">🐾</span>
        )}
        <div className="avatar-upload-overlay">
          {uploading ? <span className="avatar-upload-spinner" /> : <span className="avatar-upload-icon">📷</span>}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && <p className="avatar-upload-error">{error}</p>}
      {uploading && <p className="avatar-upload-status">Uploading…</p>}
    </div>
  )
}
