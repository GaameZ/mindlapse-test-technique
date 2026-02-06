import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthService, { type JwtPayload } from '#services/auth_service'
import '#types/http'

export default class JwtAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.response.unauthorized({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      })
    }

    const token = authHeader.substring(7)

    try {
      const payload = AuthService.verifyAccessToken(token)
      ctx.auth = { user: payload, isAuthenticated: true }
    } catch {
      return ctx.response.unauthorized({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired access token',
      })
    }

    return next()
  }
}


export function getAuthUser(ctx: HttpContext): JwtPayload {
  if (!ctx.auth) {
    throw new Error('Authentication required: ctx.auth is not set')
  }
  return ctx.auth.user
}
