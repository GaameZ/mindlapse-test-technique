import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#services/auth_service'
import { registerValidator, loginValidator, refreshTokenValidator } from '#validators/auth_validator'
import { Role } from '@mindlapse/shared'
import db from '#config/database'

export default class AuthController {
  /**
   * POST /api/v1/auth/register
   * Ce register est uniquement conçu pour les bien du test technique.
   * En production, il faudrait un espace administrateur pour permettre la création d'un premier utilisateur
   */
  async register(ctx: HttpContext): Promise<void> {
    const payload = await ctx.request.validateUsing(registerValidator)

    // Vérifier que l'email n'est pas déjà utilisé
    const existing = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', payload.email)
      .executeTakeFirst()

    if (existing) {
      ctx.response.conflict({
        error: 'CONFLICT',
        message: 'A user with this email already exists',
      })
      return
    }

    let organizationId: string

    if (payload.organizationId) {
      const org = await db
        .selectFrom('organizations')
        .select('id')
        .where('id', '=', payload.organizationId)
        .executeTakeFirst()

      if (!org) {
        ctx.response.notFound({
          error: 'NOT_FOUND',
          message: 'Organization not found',
        })
        return
      }
      organizationId = org.id
    } else {
      const orgName = payload.organizationName ?? `${payload.fullName}'s Organization`
      const org = await db
        .insertInto('organizations')
        .values({ name: orgName })
        .returning('id')
        .executeTakeFirstOrThrow()

      organizationId = org.id
    }

    const result = await AuthService.register({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      role: payload.organizationId ? Role.ANALYST : Role.OWNER,
      organizationId,
    })

    ctx.response.created({
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.full_name,
          role: result.user.role,
          organizationId: result.user.organization_id,
        },
        tokens: result.tokens,
      },
    })
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(ctx: HttpContext): Promise<void> {
    const payload = await ctx.request.validateUsing(loginValidator)

    try {
      const result = await AuthService.login(payload.email, payload.password)

      ctx.response.ok({
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.full_name,
            role: result.user.role,
            organizationId: result.user.organization_id,
          },
          tokens: result.tokens,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        ctx.response.unauthorized({
          error: 'UNAUTHORIZED',
          message: 'Invalid email or password',
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
    const { getAuthUser } = await import('#middleware/jwt_auth_middleware')
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
