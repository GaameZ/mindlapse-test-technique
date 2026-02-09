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

  /**
   * Récupère l'utilisateur connecté via /auth/me
   */
  const fetchCurrentUser = async (): Promise<void> => {
    const accessToken = authStorage.getAccessToken()
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.me()
      setUser(response.data.user)
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      // Token invalide ou expiré → on tente un refresh
      await tryRefreshToken()
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Tente de rafraîchir l'access token avec le refresh token
   */
  const tryRefreshToken = async (): Promise<void> => {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      authStorage.clearTokens()
      setUser(null)
      return
    }

    try {
      const response = await apiClient.refresh({ refreshToken })
      const tokens = response.data.tokens
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken)

      // Récupère l'utilisateur avec le nouveau token
      await fetchCurrentUser()
    } catch (err) {
      console.error('Token refresh failed:', err)
      authStorage.clearTokens()
      setUser(null)
    }
  }

  /**
   * Login avec email/password
   */
  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiClient.login({ email, password })
    const tokens = response.data.tokens
    authStorage.setTokens(tokens.accessToken, tokens.refreshToken)

    // Récupère l'utilisateur
    await fetchCurrentUser()
  }

  /**
   * Logout : efface tokens + user
   */
  const logout = (): void => {
    authStorage.clearTokens()
    setUser(null)
  }

  /**
   * Refresh manuel (pour forcer un refresh après expiration détectée)
   */
  const refreshAuth = async (): Promise<void> => {
    await tryRefreshToken()
  }

  // Au montage : vérifier si un token existe et récupérer l'utilisateur
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

/**
 * Hook pour accéder au contexte d'authentification
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
