import type { StudySession } from '../../types/pomodoro'

interface SessionCardProps {
  session: StudySession
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="session-card">
      <div className="session-card-top">
        <span className="session-card-title">{session.title}</span>
        <span className="session-card-date">{formatDate(session.finished_at ?? session.started_at)}</span>
      </div>
      <div className="session-card-stats">
        <span className="session-stat">🪙 {session.coins_earned} coins</span>
        <span className="session-stat">🔄 {session.rounds_completed} rounds</span>
        <span className="session-stat">⏱ {formatDuration(session.total_work_seconds)}</span>
      </div>
    </div>
  )
}
