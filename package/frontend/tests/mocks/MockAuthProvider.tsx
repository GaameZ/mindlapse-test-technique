import { type ReactNode, createContext, useContext } from 'react'
import type { Role } from '@mindlapse/shared'

interface MockUser {
  id: string
  email: string
  fullName: string
  role: Role
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface MockAuthContextValue {
  user: MockUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null)

interface MockAuthProviderProps {
  children: ReactNode
  user: MockUser | null
  isLoading?: boolean
}

export function MockAuthProvider({ children, user, isLoading = false }: MockAuthProviderProps) {
  const value: MockAuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login: async () => {},
    logout: async () => {},
  }

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMockAuth(): MockAuthContextValue {
  const context = useContext(MockAuthContext)
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function createMockUser(role: Role): MockUser {
  return {
    id: `test-user-${role}`,
    email: `${role.toLowerCase()}@example.com`,
    fullName: `Test ${role}`,
    role,
    organizationId: 'test-org-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
