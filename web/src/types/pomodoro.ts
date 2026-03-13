export interface StudySession {
  id: string
  user_id: string
  title: string
  status: 'active' | 'finished'
  work_duration: number    // minutes
  break_duration: number   // minutes
  coins_earned: number
  rounds_completed: number
  total_work_seconds: number
  started_at: string
  finished_at: string | null
}

export interface StudyTask {
  id: string
  session_id: string
  user_id: string
  text: string
  completed: boolean
  created_at: string
}

export interface PomodoroRound {
  id: string
  session_id: string
  user_id: string
  round_number: number
  phase: 'work' | 'break'
  duration_seconds: number
  actual_seconds: number
  completed: boolean
  started_at: string
  finished_at: string | null
}

export interface TimerSnapshot {
  sessionId: string
  phase: 'work' | 'break'
  roundNumber: number
  remainingSeconds: number
  timerStatus: 'running' | 'paused'
  totalWorkSeconds: number
  coinsAwardedMarks: number
  workDurationSec: number
  breakDurationSec: number
  pauseStartedAt: number | null
  savedAt: number
}
