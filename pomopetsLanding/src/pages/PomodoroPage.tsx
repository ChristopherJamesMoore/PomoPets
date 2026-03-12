import { useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePomodoroSession } from '../hooks/usePomodoroSession'
import { usePomodoroTimer }   from '../hooks/usePomodoroTimer'
import SessionSetup    from '../components/pomodoro/SessionSetup'
import TimerRing       from '../components/pomodoro/TimerRing'
import PhaseLabel      from '../components/pomodoro/PhaseLabel'
import TimerControls   from '../components/pomodoro/TimerControls'
import TaskList        from '../components/pomodoro/TaskList'
import SessionHistory  from '../components/pomodoro/SessionHistory'
import './PomodoroPage.css'

export default function PomodoroPage() {
  const { user, refreshProfile } = useAuth()

  const {
    activeSession,
    history,
    tasks,
    historyLoading,
    fetchHistory,
    fetchActiveSession,
    createSession,
    finishSession,
    syncSessionStats,
    addTask,
    toggleTask,
    deleteTask,
  } = usePomodoroSession(user?.id)

  // ── Callbacks for the timer hook ──────────────────────────────────────────
  const handleRoundComplete = useCallback((
    rounds: number,
    totalWork: number,
    coinsEarned: number,
  ) => {
    if (activeSession) {
      syncSessionStats(activeSession.id, totalWork, rounds, coinsEarned)
    }
  }, [activeSession, syncSessionStats])

  const handleFinish = useCallback(async (
    totalWork: number,
    rounds: number,
    coinsEarned: number,
  ) => {
    if (activeSession) {
      await finishSession(activeSession.id, totalWork, rounds, coinsEarned)
      fetchHistory()
    }
  }, [activeSession, finishSession, fetchHistory])

  const { state, start, pause, resume, skip, finish } = usePomodoroTimer(
    activeSession,
    user?.id,
    handleRoundComplete,
    handleFinish,
    refreshProfile,
  )

  // ── Bootstrap: load active session + history on mount ────────────────────
  useEffect(() => {
    fetchActiveSession()
    fetchHistory()
  }, [fetchActiveSession, fetchHistory])

  // ── Create new session ────────────────────────────────────────────────────
  const handleCreateSession = async (title: string, workMin: number, breakMin: number) => {
    await createSession(title, workMin, breakMin)
    // timer will auto-initialise via useEffect in usePomodoroTimer when activeSession changes
  }

  const totalSec = state.phase === 'work' ? state.workDurationSec : state.breakDurationSec

  return (
    <div className="pomodoro-page">
      <h1 className="pomodoro-heading">Study Timer</h1>

      {/* ── No active session: show setup ── */}
      {!activeSession && (
        <SessionSetup
          onStart={handleCreateSession}
          loading={false}
        />
      )}

      {/* ── Active session: show timer ── */}
      {activeSession && (
        <div className="pomodoro-active">
          {/* Session header */}
          <div className="pomodoro-session-header">
            <span className="pomodoro-session-title">{activeSession.title}</span>
            <div className="pomodoro-session-meta">
              <span className="pomodoro-coins">🪙 {state.coinsEarned}</span>
              <span className="pomodoro-rounds">🔄 {state.roundsCompleted} rounds</span>
            </div>
          </div>

          {/* Timer card */}
          <div className="pomodoro-timer-card">
            <PhaseLabel phase={state.phase} roundNumber={state.roundNumber} />
            <TimerRing
              totalSeconds={totalSec}
              remainingSeconds={state.remainingSeconds}
              phase={state.phase}
            />
            <TimerControls
              status={state.status}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onSkip={skip}
              onFinish={finish}
            />
            {state.status === 'paused' && (
              <p className="pomodoro-pause-warning">
                ⚠️ Pausing longer than {Math.floor(state.workDurationSec / 60)} min costs 1 coin!
              </p>
            )}
          </div>

          {/* Task list */}
          <TaskList
            tasks={tasks}
            onAdd={text => addTask(activeSession.id, text)}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        </div>
      )}

      {/* ── History ── */}
      <SessionHistory sessions={history} loading={historyLoading} />
    </div>
  )
}
