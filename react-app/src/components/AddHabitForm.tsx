import { useState } from 'react';
import GlassCard from './GlassCard';
import InputBox from './InputBox';
import Button from './Button';
import FormMessage from './FormMessage';

interface AddHabitFormProps {
  onAdd: (name: string, icon: string) => Promise<void>;
  onCancel: () => void;
}

const ICON_OPTIONS = [
  'check', 'star', 'heart', 'bolt', 'moon',
  'sun', 'mug-hot', 'broom', 'dog', 'music',
  'paintbrush', 'laptop-code',
];

export default function AddHabitForm({ onAdd, onCancel }: AddHabitFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('check');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a habit name.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onAdd(trimmed, icon);
    } catch {
      setError('Failed to create habit.');
    }
    setSaving(false);
  };

  return (
    <GlassCard className="add-habit-form">
      <h2>New Habit</h2>
      <FormMessage type="error" message={error} />

      <form onSubmit={handleSubmit}>
        <InputBox
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Habit name"
          maxLength={60}
          required
        />

        <div className="icon-picker">
          <label>Pick an icon</label>
          <div className="icon-grid">
            {ICON_OPTIONS.map(ic => (
              <button
                key={ic}
                type="button"
                className={`icon-option ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}
                aria-label={ic}
              >
                <i className={`fas fa-${ic}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="add-habit-actions">
          <Button type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Habit'}
          </Button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
