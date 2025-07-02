import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check for temporary user first (demo mode)
        const tempUser = localStorage.getItem('tempUser')
        if (tempUser) {
          setUser(JSON.parse(tempUser))
          setLoading(false)
          return
        }

        const user = await getCurrentUser()
        if (user) {
          // Get user profile from our users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .single()

          setUser({ ...user, profile })
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes (only for real auth, not temp users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear temp user on sign out
          localStorage.removeItem('tempUser')
          setUser(null)
        } else if (session?.user) {
          // Get user profile from our users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single()

          setUser({ ...session.user, profile })
        } else if (!localStorage.getItem('tempUser')) {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}