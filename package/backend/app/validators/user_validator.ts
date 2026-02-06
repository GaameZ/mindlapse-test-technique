import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string().minLength(8).maxLength(128),
    fullName: vine.string().trim().minLength(1).maxLength(255),
    role: vine.enum(['owner', 'admin', 'analyst', 'auditor']),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(1).maxLength(255).optional(),
    role: vine.enum(['owner', 'admin', 'analyst', 'auditor']).optional(),
  })
)

export const listUsersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sortBy: vine.enum(['email', 'full_name', 'role', 'created_at']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
    role: vine.enum(['owner', 'admin', 'analyst', 'auditor']).optional(),
  })
)

export const userIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)
