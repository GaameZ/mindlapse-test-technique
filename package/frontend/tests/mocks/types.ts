import type { Role, User } from '@mindlapse/shared'

export function createMockUser(role: Role, overrides?: Partial<User>): User {
  return {
    id: crypto.randomUUID(),
    email: `${role.toLowerCase()}@test.com`,
    fullName: `Test ${role}`,
    role,
    organizationId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export interface MockAuthContext {
  __setMockUser: (user: User | null) => void
}
