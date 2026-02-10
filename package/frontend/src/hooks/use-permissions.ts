import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, type Permission } from '@mindlapse/shared'

export function usePermissions() {
  const { user } = useAuth()

  const can = (permission: Permission): boolean => {
    if (!user) {
      return false
    }

    return hasPermission(user.role, permission)
  }

  const canAll = (permissions: Permission[]): boolean => {
    if (!user) {
      return false
    }

    return permissions.every((permission) => hasPermission(user.role, permission))
  }

  const canAny = (permissions: Permission[]): boolean => {
    if (!user) {
      return false
    }

    return permissions.some((permission) => hasPermission(user.role, permission))
  }

  return {
    can,
    canAll,
    canAny,
    role: user?.role,
  }
}
