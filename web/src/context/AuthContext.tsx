import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { logEvent } from '../lib/auditLog'

export interface Profile {
  id: string
  display_name: string
  email: string | null
  avatar_url: string | null
  coins: number
  theme: string
  created_at: string
  updated_at: string
  display_name_changed_at: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isProfileComplete: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isProfileComplete: false,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, coins, theme, created_at, updated_at, display_name_changed_at')
      .eq('id', userId)
      .single()
    const p = (data as Profile) ?? null
    setProfile(p)
    document.documentElement.setAttribute('data-theme', p?.theme ?? 'rose')
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const signOut = useCallback(async () => {
    if (user) logEvent(user.id, 'user.logout')
    setUser(null)
    setProfile(null)
    await supabase.auth.signOut()
  }, [user])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchProfile(u.id).finally(() => { if (mounted) setLoading(false) })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        if (event === 'SIGNED_IN') logEvent(u.id, 'user.login')
        fetchProfile(u.id).finally(() => { if (mounted) setLoading(false) })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const timeout = setTimeout(() => { if (mounted) setLoading(false) }, 5000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [fetchProfile])

  const isProfileComplete = !!(profile?.display_name?.trim())

  return (
    <AuthContext.Provider value={{ user, profile, loading, isProfileComplete, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
