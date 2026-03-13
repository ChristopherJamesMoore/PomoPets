import type { StudySession } from '../../types/pomodoro'
import SessionCard from './SessionCard'

interface SessionHistoryProps {
  sessions: StudySession[]
  loading:  boolean
}

export default function SessionHistory({ sessions, loading }: SessionHistoryProps) {
  return (
    <section className="session-history">
      <h2 className="session-history-title">Past Sessions</h2>

      {loading && (
        <div className="session-history-loading">
          <span className="loading-paw">🐾</span>
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <p className="session-history-empty">
          No sessions yet — complete your first one to see it here!
        </p>
      )}

      {!loading && sessions.map(s => (
        <SessionCard key={s.id} session={s} />
      ))}
    </section>
  )
}
