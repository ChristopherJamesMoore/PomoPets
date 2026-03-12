interface PhaseLabelProps {
  phase:       'work' | 'break'
  roundNumber: number
}

export default function PhaseLabel({ phase, roundNumber }: PhaseLabelProps) {
  return (
    <div className={`phase-label phase-label--${phase}`}>
      <span className="phase-label-round">Round {roundNumber}</span>
      <span className="phase-label-divider">·</span>
      <span className="phase-label-type">{phase === 'work' ? '📚 Work' : '☕ Break'}</span>
    </div>
  )
}
