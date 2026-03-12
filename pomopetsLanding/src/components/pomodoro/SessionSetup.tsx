import { useState } from 'react'

interface SessionSetupProps {
  onStart: (title: string, workMin: number, breakMin: number) => void
  loading: boolean
}

export default function SessionSetup({ onStart, loading }: SessionSetupProps) {
  const [title,    setTitle]    = useState('')
  const [workMin,  setWorkMin]  = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [error,    setError]    = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Give your session a title!'); return }
    if (workMin < 1 || workMin > 120) { setError('Work time: 1–120 minutes.'); return }
    if (breakMin < 1 || breakMin > 60) { setError('Break time: 1–60 minutes.'); return }
    setError('')
    onStart(title.trim(), workMin, breakMin)
  }

  return (
    <div className="session-setup-card">
      <h2 className="session-setup-title">New Study Session</h2>

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="setup-label">Session Title</label>
        <input
          className="setup-input"
          type="text"
          placeholder="e.g. Maths Revision"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={60}
          autoFocus
        />

        <div className="setup-durations">
          <div className="setup-duration-field">
            <label className="setup-label">📚 Work</label>
            <div className="duration-input-row">
              <input
                className="setup-input setup-input--number"
                type="number"
                min={1}
                max={120}
                value={workMin}
                onChange={e => setWorkMin(Number(e.target.value))}
              />
              <span className="duration-unit">min</span>
            </div>
          </div>

          <div className="setup-duration-field">
            <label className="setup-label">☕ Break</label>
            <div className="duration-input-row">
              <input
                className="setup-input setup-input--number"
                type="number"
                min={1}
                max={60}
                value={breakMin}
                onChange={e => setBreakMin(Number(e.target.value))}
              />
              <span className="duration-unit">min</span>
            </div>
          </div>
        </div>

        <p className="setup-coin-hint">
          🪙 Earn 2 coins every 30 minutes of work
        </p>

        <button type="submit" className="setup-start-btn" disabled={loading}>
          {loading ? 'Starting…' : 'Start Session 🐾'}
        </button>
      </form>
    </div>
  )
}
