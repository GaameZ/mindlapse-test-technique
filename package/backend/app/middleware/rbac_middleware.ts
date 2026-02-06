import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { getAuthUser } from '#middleware/jwt_auth_middleware'
import { hasPermission, Role } from '@mindlapse/shared'
import type { Permission } from '@mindlapse/shared'

export default class RbacMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { permission: Permission }) {
    const user = getAuthUser(ctx)

    if (!hasPermission(user.role as Role, options.permission)) {
      return ctx.response.forbidden({
        error: 'FORBIDDEN',
        message: `You do not have the permission '${options.permission}' to perform this action`,
      })
    }

    return next()
  }
}
