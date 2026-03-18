// centralized auth state for the entire app. provides the current user profile,
// loading flag, login modal visibility, and logout to all components via react
// context so nothing needs to be prop-drilled through the component tree.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { UserRole } from '@/lib/getHomePath'

interface Profile {
  full_name: string | null
  role: UserRole
}

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  loginOpen: boolean
  openLogin: () => void
  closeLogin: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// convenience hook so components can call useAuth() instead of useContext(AuthContext).
// throws if used outside of AuthProvider to catch wiring mistakes early.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// wraps the app at the top level (in App.tsx). on mount it checks for an
// existing supabase session, loads the user's profile from public.profiles,
// and subscribes to auth state changes so login/logout are reflected instantly.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)

  // fetches full_name and role from the public.profiles table for a given user id.
  // called on initial load and whenever supabase fires an auth state change event.
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile({ full_name: data.full_name, role: data.role ?? null })
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (user) {
        await loadProfile(user.id)
      }
      setLoading(false)
    }

    void init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user) {
        void loadProfile(user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        loginOpen,
        openLogin: () => setLoginOpen(true),
        closeLogin: () => setLoginOpen(false),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
