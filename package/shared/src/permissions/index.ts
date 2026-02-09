import { Role } from '../types/index.js'

export type Permission =
  | 'supplier:create'
  | 'supplier:read'
  | 'supplier:update'
  | 'supplier:delete'
  | 'supplier:update_risk'
  | 'supplier:add_notes'
  | 'audit:read'
  | 'user:manage'
  | 'org:delete'
  | 'risk_policy:configure'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    'supplier:create',
    'supplier:read',
    'supplier:update',
    'supplier:delete',
    'supplier:update_risk',
    'supplier:add_notes',
    'audit:read',
    'user:manage',
    'org:delete',
    'risk_policy:configure',
  ],
  [Role.ADMIN]: [
    'supplier:create',
    'supplier:read',
    'supplier:update',
    'supplier:delete',
    'audit:read',
    'risk_policy:configure',
  ],
  [Role.ANALYST]: ['supplier:read', 'supplier:update_risk', 'supplier:add_notes'],
  [Role.AUDITOR]: ['supplier:read', 'audit:read'],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function canAccessResource(userOrgId: string, resourceOrgId: string): boolean {
  if (!userOrgId || !resourceOrgId || userOrgId.trim() === '' || resourceOrgId.trim() === '') {
    return false
  }

  return userOrgId === resourceOrgId
}
