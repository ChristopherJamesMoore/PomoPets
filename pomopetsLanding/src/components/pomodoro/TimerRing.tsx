interface TimerRingProps {
  totalSeconds:     number
  remainingSeconds: number
  phase:            'work' | 'break'
}

const RADIUS        = 88
const STROKE        = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function TimerRing({ totalSeconds, remainingSeconds, phase }: TimerRingProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1
  const offset   = CIRCUMFERENCE * (1 - progress)
  const size     = (RADIUS + STROKE) * 2
  const color    = phase === 'work' ? '#3C0008' : '#a06080'
  const trackColor = phase === 'work' ? '#f5d0d6' : '#e8d0dc'

  return (
    <div className="timer-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="timer-ring-inner">
        <span className="timer-time">{formatTime(remainingSeconds)}</span>
      </div>
    </div>
  )
}
