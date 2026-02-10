import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '@/hooks/use-permissions'
import { Role } from '@mindlapse/shared'
import { createMockUser, type MockAuthContext } from './mocks/types'

vi.mock('@/contexts/AuthContext', () => {
  let mockUser: ReturnType<typeof createMockUser> | null = null

  return {
    useAuth: () => ({
      user: mockUser,
      isLoading: false,
      isAuthenticated: mockUser !== null,
      login: async () => {},
      logout: async () => {},
    }),
    __setMockUser: (user: ReturnType<typeof createMockUser> | null) => {
      mockUser = user
    },
  }
})

// Import de la fonction helper pour modifier le mock
const { __setMockUser } = (await import('@/contexts/AuthContext')) as unknown as MockAuthContext

describe('usePermissions', () => {
  beforeEach(() => {
    __setMockUser(null)
  })

  describe('can()', () => {
    it('should return false when user is not authenticated', () => {
      __setMockUser(null)
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:create')).toBe(false)
      expect(result.current.can('supplier:read')).toBe(false)
      expect(result.current.can('supplier:delete')).toBe(false)
    })

    it('should allow Owner to have all permissions', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:create')).toBe(true)
      expect(result.current.can('supplier:read')).toBe(true)
      expect(result.current.can('supplier:update')).toBe(true)
      expect(result.current.can('supplier:delete')).toBe(true)
      expect(result.current.can('supplier:update_risk')).toBe(true)
      expect(result.current.can('supplier:add_notes')).toBe(true)
      expect(result.current.can('audit:read')).toBe(true)
      expect(result.current.can('user:manage')).toBe(true)
      expect(result.current.can('org:delete')).toBe(true)
      expect(result.current.can('risk_policy:configure')).toBe(true)
    })

    it('should allow Admin full CRUD on suppliers but not user management', () => {
      __setMockUser(createMockUser(Role.ADMIN))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:create')).toBe(true)
      expect(result.current.can('supplier:read')).toBe(true)
      expect(result.current.can('supplier:update')).toBe(true)
      expect(result.current.can('supplier:delete')).toBe(true)
      expect(result.current.can('supplier:update_risk')).toBe(true)
      expect(result.current.can('supplier:add_notes')).toBe(true)
      expect(result.current.can('audit:read')).toBe(true)
      expect(result.current.can('risk_policy:configure')).toBe(true)

      // Should NOT have these permissions
      expect(result.current.can('user:manage')).toBe(false)
      expect(result.current.can('org:delete')).toBe(false)
    })

    it('should allow Analyst to read and update risk/notes only', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:read')).toBe(true)
      expect(result.current.can('supplier:update_risk')).toBe(true)
      expect(result.current.can('supplier:add_notes')).toBe(true)

      // Should NOT have these permissions
      expect(result.current.can('supplier:create')).toBe(false)
      expect(result.current.can('supplier:update')).toBe(false)
      expect(result.current.can('supplier:delete')).toBe(false)
      expect(result.current.can('audit:read')).toBe(false)
      expect(result.current.can('user:manage')).toBe(false)
    })

    it('should allow Auditor read-only access', () => {
      __setMockUser(createMockUser(Role.AUDITOR))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:read')).toBe(true)
      expect(result.current.can('audit:read')).toBe(true)

      // Should NOT have any write permissions
      expect(result.current.can('supplier:create')).toBe(false)
      expect(result.current.can('supplier:update')).toBe(false)
      expect(result.current.can('supplier:delete')).toBe(false)
      expect(result.current.can('supplier:update_risk')).toBe(false)
      expect(result.current.can('supplier:add_notes')).toBe(false)
      expect(result.current.can('user:manage')).toBe(false)
    })
  })

  describe('canAll()', () => {
    it('should return false when user is not authenticated', () => {
      __setMockUser(null)
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAll(['supplier:read', 'supplier:create'])).toBe(false)
    })

    it('should return true when user has ALL specified permissions', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAll(['supplier:create', 'supplier:read', 'supplier:delete'])).toBe(
        true
      )
    })

    it('should return false when user has SOME but not ALL permissions', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      // Analyst has 'supplier:read' but NOT 'supplier:create'
      expect(result.current.canAll(['supplier:read', 'supplier:create'])).toBe(false)
    })

    it('should return false when user has NONE of the permissions', () => {
      __setMockUser(createMockUser(Role.AUDITOR))
      const { result } = renderHook(() => usePermissions())

      // Auditor has neither of these
      expect(result.current.canAll(['supplier:create', 'supplier:delete'])).toBe(false)
    })

    it('should return true for empty array', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAll([])).toBe(true)
    })

    it('should work with Admin having multiple CRUD permissions', () => {
      __setMockUser(createMockUser(Role.ADMIN))
      const { result } = renderHook(() => usePermissions())

      expect(
        result.current.canAll([
          'supplier:create',
          'supplier:read',
          'supplier:update',
          'supplier:delete',
        ])
      ).toBe(true)

      expect(
        result.current.canAll([
          'supplier:create',
          'supplier:read',
          'supplier:update',
          'user:manage',
        ])
      ).toBe(false)
    })
  })

  describe('canAny()', () => {
    it('should return false when user is not authenticated', () => {
      __setMockUser(null)
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAny(['supplier:read', 'supplier:create'])).toBe(false)
    })

    it('should return true when user has AT LEAST ONE of the permissions', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      // Analyst has 'supplier:read' but NOT 'supplier:create'
      expect(result.current.canAny(['supplier:read', 'supplier:create'])).toBe(true)
    })

    it('should return false when user has NONE of the permissions', () => {
      __setMockUser(createMockUser(Role.AUDITOR))
      const { result } = renderHook(() => usePermissions())

      // Auditor has neither of these
      expect(result.current.canAny(['supplier:create', 'supplier:delete', 'user:manage'])).toBe(
        false
      )
    })

    it('should return true when user has ALL of the permissions', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAny(['supplier:create', 'supplier:read'])).toBe(true)
    })

    it('should return false for empty array', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.canAny([])).toBe(false)
    })

    it('should work with Analyst having specific permissions', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      // Has update_risk OR add_notes
      expect(result.current.canAny(['supplier:update_risk', 'supplier:add_notes'])).toBe(true)

      // Has update_risk but not update or delete
      expect(
        result.current.canAny(['supplier:update_risk', 'supplier:update', 'supplier:delete'])
      ).toBe(true)

      // Has none of these
      expect(result.current.canAny(['supplier:create', 'supplier:delete', 'user:manage'])).toBe(
        false
      )
    })

    it('should work for complex permission checks', () => {
      __setMockUser(createMockUser(Role.ADMIN))
      const { result } = renderHook(() => usePermissions())

      // Admin can update OR update_risk (Admin has both)
      expect(result.current.canAny(['supplier:update', 'supplier:update_risk'])).toBe(true)

      // Admin can delete OR manage users (Admin has delete but not user:manage)
      expect(result.current.canAny(['supplier:delete', 'user:manage'])).toBe(true)
    })
  })

  describe('role property', () => {
    it('should return undefined when user is not authenticated', () => {
      __setMockUser(null)
      const { result } = renderHook(() => usePermissions())

      expect(result.current.role).toBeUndefined()
    })

    it('should return the correct role for authenticated users', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result: ownerResult } = renderHook(() => usePermissions())
      expect(ownerResult.current.role).toBe(Role.OWNER)

      __setMockUser(createMockUser(Role.ADMIN))
      const { result: adminResult } = renderHook(() => usePermissions())
      expect(adminResult.current.role).toBe(Role.ADMIN)

      __setMockUser(createMockUser(Role.ANALYST))
      const { result: analystResult } = renderHook(() => usePermissions())
      expect(analystResult.current.role).toBe(Role.ANALYST)

      __setMockUser(createMockUser(Role.AUDITOR))
      const { result: auditorResult } = renderHook(() => usePermissions())
      expect(auditorResult.current.role).toBe(Role.AUDITOR)
    })
  })

  describe('Real-world use cases', () => {
    it('can show "Add Supplier" button (supplier:create)', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result: ownerResult } = renderHook(() => usePermissions())
      expect(ownerResult.current.can('supplier:create')).toBe(true)

      __setMockUser(createMockUser(Role.ADMIN))
      const { result: adminResult } = renderHook(() => usePermissions())
      expect(adminResult.current.can('supplier:create')).toBe(true)

      __setMockUser(createMockUser(Role.ANALYST))
      const { result: analystResult } = renderHook(() => usePermissions())
      expect(analystResult.current.can('supplier:create')).toBe(false)

      __setMockUser(createMockUser(Role.AUDITOR))
      const { result: auditorResult } = renderHook(() => usePermissions())
      expect(auditorResult.current.can('supplier:create')).toBe(false)
    })

    it('can show "Delete" button (supplier:delete)', () => {
      __setMockUser(createMockUser(Role.OWNER))
      const { result: ownerResult } = renderHook(() => usePermissions())
      expect(ownerResult.current.can('supplier:delete')).toBe(true)

      __setMockUser(createMockUser(Role.ADMIN))
      const { result: adminResult } = renderHook(() => usePermissions())
      expect(adminResult.current.can('supplier:delete')).toBe(true)

      __setMockUser(createMockUser(Role.ANALYST))
      const { result: analystResult } = renderHook(() => usePermissions())
      expect(analystResult.current.can('supplier:delete')).toBe(false)

      __setMockUser(createMockUser(Role.AUDITOR))
      const { result: auditorResult } = renderHook(() => usePermissions())
      expect(auditorResult.current.can('supplier:delete')).toBe(false)
    })

    it('EditableField should show Edit button based on permissions', () => {
      // Test for general update permission
      __setMockUser(createMockUser(Role.ADMIN))
      const { result: adminResult } = renderHook(() => usePermissions())
      expect(adminResult.current.can('supplier:update')).toBe(true)

      __setMockUser(createMockUser(Role.ANALYST))
      const { result: analystResult } = renderHook(() => usePermissions())
      expect(analystResult.current.can('supplier:update')).toBe(false)
    })

    it('EditableField should allow Analyst to edit Risk Level', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:update_risk')).toBe(true)
      expect(result.current.can('supplier:update')).toBe(false)
    })

    it('EditableField should allow Analyst to edit Notes', () => {
      __setMockUser(createMockUser(Role.ANALYST))
      const { result } = renderHook(() => usePermissions())

      expect(result.current.can('supplier:add_notes')).toBe(true)
      expect(result.current.can('supplier:update')).toBe(false)
    })
  })
})
