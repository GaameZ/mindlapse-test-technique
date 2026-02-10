import vine from '@vinejs/vine'

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
