import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string().minLength(8).maxLength(128),
    fullName: vine.string().trim().minLength(1).maxLength(255),
    organizationName: vine.string().trim().minLength(1).maxLength(255).optional(),
    organizationId: vine.string().uuid().optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim().toLowerCase(),
    password: vine.string().minLength(1),
  })
)

export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string().minLength(1),
  })
)
