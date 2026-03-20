"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserSession {
  id: string
  email: string
  name?: string
  image?: string
}

interface AppContextType {
  user: UserSession | null
  credits: number
  loading: boolean
  fetchCredits: () => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

function mapSessionUser(user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): UserSession {
  return {
    id: user.id,
    email: user.email || "",
    name: (user.user_metadata?.full_name as string | undefined) || (user.user_metadata?.name as string | undefined),
    image: (user.user_metadata?.avatar_url as string | undefined) || (user.user_metadata?.picture as string | undefined),
  }
}

function isLockAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)

  // Use ref to keep stable reference to supabase client
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Get or create supabase client (singleton)
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const fetchCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()
      setCredits(data.credits)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    try {
      await supabase.auth.signOut()
    } catch (error) {
      if (!isLockAbortError(error)) {
        throw error
      }
    }
    setUser(null)
    setCredits(0)
  }, [getSupabase])

  useEffect(() => {
    const supabase = getSupabase()
    let mounted = true

    // On the client, use session storage first to avoid auth lock contention.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return

      if (error) {
        if (isLockAbortError(error)) {
          setLoading(false)
          return
        }

        console.warn('Auth session error:', error.message)
        setUser(null)
        setCredits(0)
        setLoading(false)
        return
      }

      if (session?.user) {
        setUser(mapSessionUser(session.user))
        fetchCredits()
      }
      setLoading(false)
    }).catch((error) => {
      if (isLockAbortError(error)) {
        if (mounted) {
          setLoading(false)
        }
        return
      }

      console.error('Auth error:', error)
      if (mounted) {
        setUser(null)
        setCredits(0)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(mapSessionUser(session.user))
        fetchCredits()
      } else {
        setUser(null)
        setCredits(0)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [getSupabase, fetchCredits])

  return (
    <AppContext.Provider value={{ user, credits, loading, fetchCredits, signOut }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
