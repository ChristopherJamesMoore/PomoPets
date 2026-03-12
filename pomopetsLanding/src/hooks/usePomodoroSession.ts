import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { StudySession, StudyTask } from '../types/pomodoro'

const SNAPSHOT_KEY = 'pomopets_pomodoro_snapshot'

export function usePomodoroSession(userId: string | undefined) {
  const [activeSession, setActiveSession]   = useState<StudySession | null>(null)
  const [history, setHistory]               = useState<StudySession[]>([])
  const [tasks, setTasks]                   = useState<StudyTask[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Fetch finished sessions for history ────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!userId) return
    setHistoryLoading(true)
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'finished')
      .order('finished_at', { ascending: false })
      .limit(50)
    setHistory((data as StudySession[]) ?? [])
    setHistoryLoading(false)
  }, [userId])

  // ── Fetch or resume an existing active session ──────────────────────────────
  const fetchActiveSession = useCallback(async () => {
    if (!userId) return null
    const { data } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      setActiveSession(data as StudySession)
      await fetchTasksForSession(data.id)
    }
    return (data as StudySession) ?? null
  }, [userId])

  // ── Create a new session ────────────────────────────────────────────────────
  const createSession = useCallback(async (
    title: string,
    workDuration: number,
    breakDuration: number,
  ): Promise<StudySession | null> => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({ user_id: userId, title: title.trim(), work_duration: workDuration, break_duration: breakDuration })
      .select()
      .single()
    if (error || !data) return null
    const session = data as StudySession
    setActiveSession(session)
    setTasks([])
    return session
  }, [userId])

  // ── Finish a session ────────────────────────────────────────────────────────
  const finishSession = useCallback(async (
    sessionId: string,
    totalWorkSeconds: number,
    roundsCompleted: number,
    coinsEarned: number,
  ) => {
    await supabase
      .from('study_sessions')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString(),
        total_work_seconds: totalWorkSeconds,
        rounds_completed: roundsCompleted,
        coins_earned: coinsEarned,
      })
      .eq('id', sessionId)
    localStorage.removeItem(SNAPSHOT_KEY)
    setActiveSession(null)
    setTasks([])
  }, [])

  // ── Update session stats mid-session (called on round complete / nav away) ──
  const syncSessionStats = useCallback(async (
    sessionId: string,
    totalWorkSeconds: number,
    roundsCompleted: number,
    coinsEarned: number,
  ) => {
    await supabase
      .from('study_sessions')
      .update({ total_work_seconds: totalWorkSeconds, rounds_completed: roundsCompleted, coins_earned: coinsEarned })
      .eq('id', sessionId)
  }, [])

  // ── Tasks ───────────────────────────────────────────────────────────────────
  const fetchTasksForSession = async (sessionId: string) => {
    const { data } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setTasks((data as StudyTask[]) ?? [])
  }

  const addTask = useCallback(async (sessionId: string, text: string) => {
    if (!userId || !text.trim()) return
    const { data } = await supabase
      .from('study_tasks')
      .insert({ session_id: sessionId, user_id: userId, text: text.trim() })
      .select()
      .single()
    if (data) setTasks(prev => [...prev, data as StudyTask])
  }, [userId])

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    await supabase.from('study_tasks').update({ completed }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t))
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    await supabase.from('study_tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  return {
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
  }
}
