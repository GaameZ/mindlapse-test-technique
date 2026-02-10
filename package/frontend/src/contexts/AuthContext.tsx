import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/lib/api/client'
import { authStorage } from '@/lib/auth-storage'
import type { User } from '@mindlapse/shared'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCurrentUser = async (): Promise<void> => {
    const accessToken = authStorage.getAccessToken()
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.me()
      setUser(response.data.user)
      setIsLoading(false)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to fetch current user:', err)
      }
      await tryRefreshToken()
    }
  }

  const tryRefreshToken = async (): Promise<void> => {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      authStorage.clearTokens()
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.refresh({ refreshToken })
      const tokens = response.data.tokens
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken)

      const userResponse = await apiClient.me()
      setUser(userResponse.data.user)
      setIsLoading(false)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Token refresh failed:', err)
      }
      authStorage.clearTokens()
      setUser(null)
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiClient.login({ email, password })
    const tokens = response.data.tokens
    authStorage.setTokens(tokens.accessToken, tokens.refreshToken)

    await fetchCurrentUser()
  }

  const logout = (): void => {
    authStorage.clearTokens()
    setUser(null)
  }

  const refreshAuth = async (): Promise<void> => {
    await tryRefreshToken()
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
