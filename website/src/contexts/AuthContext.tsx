/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/authService'

interface User {
  id: string
  email: string
  username: string
  tier: 'free' | 'pro' | 'enterprise'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    refreshAuth()
  }, [])

  const refreshAuth = async () => {
    setIsLoading(true)
    try {
      const isAuth = await authService.verifyToken()
      if (isAuth) {
        // In a real app, fetch user data from API
        // For now, we'll just check if token exists
        const token = authService.isAuthenticated()
        if (token) {
          // TODO: Fetch user data from API
          setUser({
            id: '1',
            email: 'user@example.com',
            username: 'user',
            tier: 'free',
          })
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    setUser(response.user)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

