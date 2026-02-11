import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#services/auth_service'
import { loginValidator, refreshTokenValidator } from '#validators/auth_validator'
import { getAuthUser } from '#middleware/jwt_auth_middleware'

export default class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(ctx: HttpContext): Promise<void> {
    const payload = await ctx.request.validateUsing(loginValidator)

    try {
      const result = await AuthService.login(payload.email, payload.password)

      ctx.response.ok({
        data: {
          tokens: result.tokens,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        ctx.response.unauthorized({
          error: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        })
        return
      }
      throw error
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(ctx: HttpContext): Promise<void> {
    const payload = await ctx.request.validateUsing(refreshTokenValidator)

    try {
      const tokens = await AuthService.refreshTokens(payload.refreshToken)
      ctx.response.ok({ data: { tokens } })
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        ctx.response.unauthorized({
          error: 'UNAUTHORIZED',
          message: 'User no longer exists',
        })
        return
      }
      ctx.response.unauthorized({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      })
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async me(ctx: HttpContext): Promise<void> {
    const authUser = getAuthUser(ctx)

    const user = await AuthService.getUserById(authUser.userId)

    if (!user) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'User not found',
      })
      return
    }

    ctx.response.ok({
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          organizationId: user.organization_id,
        },
      },
    })
  }
}
