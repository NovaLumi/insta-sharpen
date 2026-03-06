"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
    await supabase.auth.signOut()
    setUser(null)
    setCredits(0)
  }, [supabase.auth])

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        })
        fetchCredits()
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          image: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        })
        fetchCredits()
      } else {
        setUser(null)
        setCredits(0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchCredits])

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
