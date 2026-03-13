import type { TimerStatus } from '../../hooks/usePomodoroTimer'

interface TimerControlsProps {
  status:    TimerStatus
  onStart:   () => void
  onPause:   () => void
  onResume:  () => Promise<void>
  onSkip:    () => void
  onFinish:  () => void
}

export default function TimerControls({
  status, onStart, onPause, onResume, onSkip, onFinish,
}: TimerControlsProps) {
  return (
    <div className="timer-controls">
      {status === 'idle' && (
        <button className="tc-btn tc-btn--primary" onClick={onStart}>
          ▶ Start
        </button>
      )}

      {status === 'running' && (
        <>
          <button className="tc-btn tc-btn--secondary" onClick={onPause}>⏸ Pause</button>
          <button className="tc-btn tc-btn--ghost"     onClick={onSkip}>⏭ Skip</button>
          <button className="tc-btn tc-btn--danger"    onClick={onFinish}>✓ Finish Session</button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button className="tc-btn tc-btn--primary"   onClick={onResume}>▶ Resume</button>
          <button className="tc-btn tc-btn--ghost"     onClick={onSkip}>⏭ Skip</button>
          <button className="tc-btn tc-btn--danger"    onClick={onFinish}>✓ Finish Session</button>
        </>
      )}
    </div>
  )
}
