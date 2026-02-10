import type { HttpContext } from '@adonisjs/core/http'
import { getAuthUser } from '#middleware/jwt_auth_middleware'
import db from '#config/database'

export default class OrganizationsController {
  /**
   * DELETE /api/v1/organizations/current
   * Supprimer l'organisation courante et tous ses utilisateurs/fournisseurs (Owner seulement).
   */
  async destroyCurrent(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)

    const organization = await db
      .selectFrom('organizations')
      .select(['id', 'name'])
      .where('id', '=', user.organizationId)
      .executeTakeFirst()

    if (!organization) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Organization not found',
      })
      return
    }

    await db
      .deleteFrom('audit_logs')
      .where('user_id', 'in', (qb) =>
        qb.selectFrom('users').select('id').where('organization_id', '=', user.organizationId)
      )
      .execute()

    await db.deleteFrom('suppliers').where('organization_id', '=', user.organizationId).execute()

    await db.deleteFrom('users').where('organization_id', '=', user.organizationId).execute()

    await db.deleteFrom('organizations').where('id', '=', user.organizationId).execute()

    ctx.response.ok({
      message: `Organization "${organization.name}" and all associated data deleted successfully`,
    })
  }
}
