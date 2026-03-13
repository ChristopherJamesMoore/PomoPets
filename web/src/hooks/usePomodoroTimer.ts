import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { StudySession } from '../types/pomodoro'
import type { TimerSnapshot } from '../types/pomodoro'

const SNAPSHOT_KEY       = 'pomopets_pomodoro_snapshot'
const REWARD_INTERVAL    = 1800   // 30 minutes in seconds
const COINS_PER_INTERVAL = 2
const PENALTY_COINS      = 1

export type TimerStatus = 'idle' | 'running' | 'paused'
export type Phase = 'work' | 'break'

interface TimerState {
  status:            TimerStatus
  phase:             Phase
  roundNumber:       number
  remainingSeconds:  number
  workDurationSec:   number
  breakDurationSec:  number
  totalWorkSeconds:  number
  coinsAwardedMarks: number
  coinsEarned:       number          // session total for display / syncing
  roundsCompleted:   number
  pauseStartedAt:    number | null   // Date.now() when paused
  penaltyApplied:    boolean         // reset each new pause
}

function buildInitialState(workMin: number, breakMin: number): TimerState {
  return {
    status:            'idle',
    phase:             'work',
    roundNumber:       1,
    remainingSeconds:  workMin * 60,
    workDurationSec:   workMin * 60,
    breakDurationSec:  breakMin * 60,
    totalWorkSeconds:  0,
    coinsAwardedMarks: 0,
    coinsEarned:       0,
    roundsCompleted:   0,
    pauseStartedAt:    null,
    penaltyApplied:    false,
  }
}

export function usePomodoroTimer(
  session: StudySession | null,
  userId: string | undefined,
  onRoundComplete: (rounds: number, totalWork: number, coinsEarned: number) => void,
  onFinish:        (totalWork: number, rounds: number, coinsEarned: number) => void,
  refreshProfile:  () => Promise<void>,
) {
  const [state, setState] = useState<TimerState>(() =>
    session
      ? buildInitialState(session.work_duration, session.break_duration)
      : buildInitialState(25, 5)
  )

  // Keep a ref so the interval can always read the latest state without stale closures
  const stateRef = useRef(state)
  stateRef.current = state

  const sessionRef = useRef(session)
  sessionRef.current = session

  // ── Coin helpers ────────────────────────────────────────────────────────────
  const awardCoins = useCallback(async (amount: number) => {
    if (!userId || amount <= 0) return
    await supabase.rpc('earn_coins', {
      p_user_id: userId,
      p_amount:  amount,
      p_type:    'pomodoro_complete',
    })
    await refreshProfile()
  }, [userId, refreshProfile])

  const penaliseCoins = useCallback(async () => {
    if (!userId) return
    try {
      await supabase.rpc('spend_coins', {
        p_user_id: userId,
        p_amount:  PENALTY_COINS,
        p_type:    'manual_adjustment',
        p_note:    'Pomodoro pause penalty',
      })
      await refreshProfile()
    } catch {
      // User may have 0 coins — silently ignore
    }
  }, [userId, refreshProfile])

  // ── Phase completion handler (called inside interval) ──────────────────────
  const handlePhaseComplete = useCallback(() => {
    setState(prev => {
      const isWorkPhase = prev.phase === 'work'
      const newRoundsCompleted = isWorkPhase ? prev.roundsCompleted + 1 : prev.roundsCompleted
      const nextPhase: Phase  = isWorkPhase ? 'break' : 'work'
      const nextRound         = isWorkPhase ? prev.roundNumber : prev.roundNumber + 1
      const nextRemaining     = isWorkPhase ? prev.breakDurationSec : prev.workDurationSec

      // Fire the round-complete callback for Supabase sync (async, outside setState)
      if (isWorkPhase) {
        setTimeout(() => {
          onRoundComplete(
            newRoundsCompleted,
            stateRef.current.totalWorkSeconds,
            stateRef.current.coinsEarned,
          )
        }, 0)
      }

      return {
        ...prev,
        phase:           nextPhase,
        roundNumber:     nextRound,
        roundsCompleted: newRoundsCompleted,
        remainingSeconds: nextRemaining,
      }
    })
  }, [onRoundComplete])

  // ── Interval tick ──────────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      const s = stateRef.current
      if (s.status !== 'running') return

      // Advance work time counter and check coin thresholds
      if (s.phase === 'work') {
        const newTotalWork = s.totalWorkSeconds + 1
        const newMarks     = Math.floor(newTotalWork / REWARD_INTERVAL)

        if (newMarks > s.coinsAwardedMarks) {
          const delta      = newMarks - s.coinsAwardedMarks
          const coinsToAdd = delta * COINS_PER_INTERVAL
          // Fire async coin award outside setState
          awardCoins(coinsToAdd)
          setState(prev => ({
            ...prev,
            totalWorkSeconds:  newTotalWork,
            coinsAwardedMarks: newMarks,
            coinsEarned:       prev.coinsEarned + coinsToAdd,
            remainingSeconds:  prev.remainingSeconds - 1,
          }))
        } else {
          setState(prev => ({
            ...prev,
            totalWorkSeconds: newTotalWork,
            remainingSeconds: prev.remainingSeconds - 1,
          }))
        }
      } else {
        setState(prev => ({ ...prev, remainingSeconds: prev.remainingSeconds - 1 }))
      }

      // Phase complete?
      if (stateRef.current.remainingSeconds <= 1) {
        handlePhaseComplete()
      }
    }, 1000)
  }, [awardCoins, handlePhaseComplete])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // ── Restore from localStorage on mount ────────────────────────────────────
  useEffect(() => {
    if (!session) return

    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return
    try {
      const snap: TimerSnapshot = JSON.parse(raw)
      if (snap.sessionId !== session.id) return

      const now     = Date.now()
      const elapsed = Math.floor((now - snap.savedAt) / 1000)

      if (snap.timerStatus === 'paused') {
        const totalPaused = snap.pauseStartedAt
          ? Math.floor((now - snap.pauseStartedAt) / 1000)
          : 0
        const needsPenalty = totalPaused > snap.workDurationSec

        if (needsPenalty) penaliseCoins()

        setState({
          status:            'paused',
          phase:             snap.phase,
          roundNumber:       snap.roundNumber,
          remainingSeconds:  snap.remainingSeconds,
          workDurationSec:   snap.workDurationSec,
          breakDurationSec:  snap.breakDurationSec,
          totalWorkSeconds:  snap.totalWorkSeconds,
          coinsAwardedMarks: snap.coinsAwardedMarks,
          coinsEarned:       session.coins_earned,
          roundsCompleted:   session.rounds_completed,
          pauseStartedAt:    snap.pauseStartedAt,
          penaltyApplied:    needsPenalty,
        })
        return
      }

      // Was running — simulate elapsed phases
      const restored = simulateElapsed(snap, elapsed)

      // Award any coins that accrued while away
      const coinDelta = (restored.coinsAwardedMarks - snap.coinsAwardedMarks) * COINS_PER_INTERVAL
      if (coinDelta > 0) awardCoins(coinDelta)

      setState({
        status:            'running',
        phase:             restored.phase,
        roundNumber:       restored.roundNumber,
        remainingSeconds:  restored.remainingSeconds,
        workDurationSec:   snap.workDurationSec,
        breakDurationSec:  snap.breakDurationSec,
        totalWorkSeconds:  restored.totalWorkSeconds,
        coinsAwardedMarks: restored.coinsAwardedMarks,
        coinsEarned:       session.coins_earned + coinDelta,
        roundsCompleted:   session.rounds_completed + restored.roundsCompletedDelta,
        pauseStartedAt:    null,
        penaltyApplied:    false,
      })
    } catch {
      localStorage.removeItem(SNAPSHOT_KEY)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  // Start/stop interval based on status
  useEffect(() => {
    if (state.status === 'running') {
      startInterval()
    } else {
      stopInterval()
    }
    return stopInterval
  }, [state.status, startInterval, stopInterval])

  // ── Save snapshot on unmount / beforeunload ────────────────────────────────
  const saveSnapshot = useCallback(() => {
    const s  = stateRef.current
    const se = sessionRef.current
    if (!se || s.status === 'idle') return

    const snap: TimerSnapshot = {
      sessionId:         se.id,
      phase:             s.phase,
      roundNumber:       s.roundNumber,
      remainingSeconds:  s.remainingSeconds,
      timerStatus:       s.status,
      totalWorkSeconds:  s.totalWorkSeconds,
      coinsAwardedMarks: s.coinsAwardedMarks,
      workDurationSec:   s.workDurationSec,
      breakDurationSec:  s.breakDurationSec,
      pauseStartedAt:    s.pauseStartedAt,
      savedAt:           Date.now(),
    }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap))
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', saveSnapshot)
    return () => {
      saveSnapshot()
      window.removeEventListener('beforeunload', saveSnapshot)
    }
  }, [saveSnapshot])

  // Re-initialise state when a new session is provided (after create)
  useEffect(() => {
    if (!session) return
    setState(buildInitialState(session.work_duration, session.break_duration))
  }, [session?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public controls ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    setState(prev => ({ ...prev, status: 'running' }))
  }, [])

  const pause = useCallback(() => {
    setState(prev => ({
      ...prev,
      status:         'paused',
      pauseStartedAt: Date.now(),
      penaltyApplied: false,
    }))
  }, [])

  const resume = useCallback(async () => {
    const s   = stateRef.current
    const now = Date.now()

    if (s.pauseStartedAt !== null && !s.penaltyApplied) {
      const pausedSec = Math.floor((now - s.pauseStartedAt) / 1000)
      if (pausedSec > s.workDurationSec) {
        await penaliseCoins()
        setState(prev => ({
          ...prev,
          status:         'running',
          pauseStartedAt: null,
          penaltyApplied: true,
        }))
        return
      }
    }

    setState(prev => ({ ...prev, status: 'running', pauseStartedAt: null }))
  }, [penaliseCoins])

  const skip = useCallback(() => {
    handlePhaseComplete()
  }, [handlePhaseComplete])

  const finish = useCallback(async () => {
    stopInterval()
    const s = stateRef.current
    onFinish(s.totalWorkSeconds, s.roundsCompleted, s.coinsEarned)
    localStorage.removeItem(SNAPSHOT_KEY)
    setState(buildInitialState(
      (sessionRef.current?.work_duration ?? 25),
      (sessionRef.current?.break_duration ?? 5),
    ))
  }, [stopInterval, onFinish])

  return { state, start, pause, resume, skip, finish }
}

// ── Simulate elapsed phases while away ──────────────────────────────────────
function simulateElapsed(snap: TimerSnapshot, elapsedSeconds: number) {
  let remaining          = snap.remainingSeconds
  let elapsed            = elapsedSeconds
  let phase              = snap.phase as Phase
  let roundNumber        = snap.roundNumber
  let totalWorkSeconds   = snap.totalWorkSeconds
  let coinsAwardedMarks  = snap.coinsAwardedMarks
  let roundsCompletedDelta = 0

  while (elapsed > 0) {
    if (elapsed >= remaining) {
      // This phase completed while away
      elapsed -= remaining
      if (phase === 'work') {
        totalWorkSeconds += remaining
        const newMarks    = Math.floor(totalWorkSeconds / REWARD_INTERVAL)
        coinsAwardedMarks = Math.max(coinsAwardedMarks, newMarks)
        roundsCompletedDelta++
        phase = 'break'
        remaining = snap.breakDurationSec
      } else {
        phase = 'work'
        roundNumber++
        remaining = snap.workDurationSec
      }
    } else {
      // Partial phase — the timer is somewhere in this phase
      if (phase === 'work') {
        totalWorkSeconds += elapsed
        const newMarks    = Math.floor(totalWorkSeconds / REWARD_INTERVAL)
        coinsAwardedMarks = Math.max(coinsAwardedMarks, newMarks)
      }
      remaining -= elapsed
      elapsed = 0
    }
  }

  return { phase, roundNumber, remainingSeconds: remaining, totalWorkSeconds, coinsAwardedMarks, roundsCompletedDelta }
}
