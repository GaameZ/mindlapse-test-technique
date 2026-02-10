import { Role } from '@mindlapse/shared'

export const ROLES = [Role.OWNER, Role.ADMIN, Role.ANALYST, Role.AUDITOR] as const

export const ROLE_LABELS: Record<Role, string> = {
  [Role.OWNER]: 'Owner',
  [Role.ADMIN]: 'Admin',
  [Role.ANALYST]: 'Analyst',
  [Role.AUDITOR]: 'Auditor',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.OWNER]: 'Full access including user management and organization deletion',
  [Role.ADMIN]: 'Full access to suppliers and risk policies',
  [Role.ANALYST]: 'Read suppliers, update risk levels and notes',
  [Role.AUDITOR]: 'Read-only access with full audit trail visibility',
}
