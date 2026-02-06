import type { HttpContext } from '@adonisjs/core/http'
import { getAuthUser } from '#middleware/jwt_auth_middleware'
import AuthService from '#services/auth_service'
import db from '#config/database'
import { type Role, DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@mindlapse/shared'
import {
  createUserValidator,
  updateUserValidator,
  listUsersValidator,
  userIdValidator,
} from '#validators/user_validator'

export default class UsersController {
  /**
   * GET /api/v1/users
   * Liste paginée des utilisateurs de l'organisation (Owner/Admin seulement).
   */
  async index(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const query = await ctx.request.validateUsing(listUsersValidator)

    const page = query.page ?? DEFAULT_PAGE
    const limit = query.limit ?? DEFAULT_PAGE_SIZE
    const sortBy = query.sortBy ?? 'created_at'
    const sortOrder = query.sortOrder ?? 'desc'
    const offset = (page - 1) * limit

    let baseQuery = db
      .selectFrom('users')
      .where('organization_id', '=', user.organizationId)

    if (query.role) {
      baseQuery = baseQuery.where('role', '=', query.role as Role)
    }

    const countResult = await baseQuery
      .select(db.fn.countAll().as('total'))
      .executeTakeFirstOrThrow()

    const total = Number(countResult.total)

    const users = await baseQuery
      .select(['id', 'email', 'full_name', 'role', 'organization_id', 'created_at'])
      .orderBy(sortBy, sortOrder)
      .offset(offset)
      .limit(limit)
      .execute()

    const lastPage = Math.ceil(total / limit) || 1

    ctx.response.ok({
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        organizationId: u.organization_id,
        createdAt: u.created_at,
      })),
      meta: {
        total,
        page,
        lastPage,
        perPage: limit,
      },
    })
  }

  /**
   * GET /api/v1/users/:id
   * Afficher les détails d'un utilisateur (Owner/Admin seulement).
   */
  async show(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await userIdValidator.validate(ctx.params)

    const targetUser = await db
      .selectFrom('users')
      .select(['id', 'email', 'full_name', 'role', 'organization_id', 'created_at'])
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!targetUser) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'User not found',
      })
      return
    }

    ctx.response.ok({
      data: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: targetUser.role,
        organizationId: targetUser.organization_id,
        createdAt: targetUser.created_at,
      },
    })
  }

  /**
   * POST /api/v1/users
   * Créer un nouvel utilisateur dans l'organisation (Owner seulement).
   */
  async store(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const payload = await ctx.request.validateUsing(createUserValidator)

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

    const passwordHash = await AuthService.hashPassword(payload.password)

    const newUser = await db
      .insertInto('users')
      .values({
        email: payload.email,
        password_hash: passwordHash,
        full_name: payload.fullName,
        role: payload.role as Role,
        organization_id: user.organizationId,
      })
      .returning(['id', 'email', 'full_name', 'role', 'organization_id', 'created_at'])
      .executeTakeFirstOrThrow()

    ctx.response.created({
      data: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        organizationId: newUser.organization_id,
        createdAt: newUser.created_at,
      },
    })
  }

  /**
   * PUT /api/v1/users/:id
   * Mettre à jour un utilisateur (Owner seulement).
   */
  async update(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await userIdValidator.validate(ctx.params)
    const payload = await ctx.request.validateUsing(updateUserValidator)

    const targetUser = await db
      .selectFrom('users')
      .select('id')
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!targetUser) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'User not found',
      })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (payload.fullName !== undefined) updateData.full_name = payload.fullName
    if (payload.role !== undefined) updateData.role = payload.role

    if (Object.keys(updateData).length === 0) {
      ctx.response.badRequest({
        error: 'BAD_REQUEST',
        message: 'No fields to update',
      })
      return
    }

    const updated = await db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .returning(['id', 'email', 'full_name', 'role', 'organization_id', 'created_at'])
      .executeTakeFirstOrThrow()

    ctx.response.ok({
      data: {
        id: updated.id,
        email: updated.email,
        fullName: updated.full_name,
        role: updated.role,
        organizationId: updated.organization_id,
        createdAt: updated.created_at,
      },
    })
  }

  /**
   * DELETE /api/v1/users/:id
   * Supprimer un utilisateur (Owner seulement).
   */
  async destroy(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await userIdValidator.validate(ctx.params)

    if (id === user.userId) {
      ctx.response.badRequest({
        error: 'BAD_REQUEST',
        message: 'You cannot delete yourself',
      })
      return
    }

    const targetUser = await db
      .selectFrom('users')
      .select('id')
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!targetUser) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'User not found',
      })
      return
    }

    await db
      .deleteFrom('users')
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .execute()

    ctx.response.ok({ message: 'User deleted successfully' })
  }
}
