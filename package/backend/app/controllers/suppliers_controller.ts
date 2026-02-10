import type { HttpContext } from '@adonisjs/core/http'
import { getAuthUser } from '#middleware/jwt_auth_middleware'
import db from '#config/database'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@mindlapse/shared'
import type { RiskLevel, SupplierCategory, SupplierStatus } from '@mindlapse/shared'
import '#types/http'
import {
  createSupplierValidator,
  updateSupplierValidator,
  listSuppliersValidator,
  supplierIdValidator,
  updateRiskLevelValidator,
  updateNotesValidator,
} from '#validators/supplier_validator'
import { listAuditLogsValidator } from '#validators/audit_log_validator'
import { aiQueueService } from '#services/ai_queue_service'

export default class SuppliersController {
  /**
   * GET /api/v1/suppliers
   * Liste paginée des fournisseurs de l'organisation.
   */
  async index(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const query = await ctx.request.validateUsing(listSuppliersValidator)

    const page = query.page ?? DEFAULT_PAGE
    const limit = query.limit ?? DEFAULT_PAGE_SIZE
    const sortBy = query.sortBy ?? 'created_at'
    const sortOrder = query.sortOrder ?? 'desc'
    const offset = (page - 1) * limit

    let baseQuery = db.selectFrom('suppliers').where('organization_id', '=', user.organizationId)

    if (query.search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${query.search}%`),
          eb('domain', 'ilike', `%${query.search}%`),
        ])
      )
    }
    if (query.category) {
      baseQuery = baseQuery.where('category', '=', query.category as SupplierCategory)
    }
    if (query.riskLevel) {
      baseQuery = baseQuery.where('risk_level', '=', query.riskLevel as RiskLevel)
    }
    if (query.status) {
      baseQuery = baseQuery.where('status', '=', query.status as SupplierStatus)
    }

    const countResult = await baseQuery
      .select(db.fn.countAll().as('total'))
      .executeTakeFirstOrThrow()

    const total = Number(countResult.total)

    const suppliers = await baseQuery
      .selectAll()
      .orderBy(sortBy, sortOrder)
      .offset(offset)
      .limit(limit)
      .execute()

    const lastPage = Math.ceil(total / limit) || 1

    ctx.response.ok({
      data: suppliers.map(this.formatSupplier),
      meta: {
        total,
        page,
        lastPage,
        perPage: limit,
      },
    })
  }

  /**
   * GET /api/v1/suppliers/:id
   * Détail d'un fournisseur. Accessible uniquement si le supplier appartient à l'organisation de l'utilisateur.
   */
  async show(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await supplierIdValidator.validate(ctx.params)

    const supplier = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplier) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    ctx.response.ok({ data: this.formatSupplier(supplier) })
  }

  /**
   * POST /api/v1/suppliers
   * Création d'un nouveau fournisseur. Le supplier est automatiquement lié à l'organisation de l'utilisateur.
   * L'ID du supplier créé est stocké dans le contexte pour que le middleware d'audit puisse l'utiliser.
   */
  async store(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const payload = await ctx.request.validateUsing(createSupplierValidator)

    const supplier = await db
      .insertInto('suppliers')
      .values({
        name: payload.name,
        domain: payload.domain,
        category: payload.category as SupplierCategory,
        risk_level: payload.riskLevel as RiskLevel,
        status: payload.status as SupplierStatus,
        contract_end_date: payload.contractEndDate ?? null,
        notes: payload.notes ?? null,
        organization_id: user.organizationId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await aiQueueService.enqueueRiskAnalysis({
      supplierId: supplier.id,
      supplierName: supplier.name,
      domain: supplier.domain,
      category: supplier.category,
      status: supplier.status,
      contractEndDate: supplier.contract_end_date?.toISOString() ?? null,
      notes: supplier.notes,
      organizationId: user.organizationId,
    })

    ctx.supplierId = supplier.id

    ctx.response.created({ data: this.formatSupplier(supplier) })
  }

  /**
   * PUT /api/v1/suppliers/:id
   * Modification d'un fournisseur. Seules les colonnes présentes dans le payload sont mises à jour.
   * Accessible uniquement si le supplier appartient à l'organisation de l'utilisateur.
   */
  async update(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await supplierIdValidator.validate(ctx.params)
    const payload = await ctx.request.validateUsing(updateSupplierValidator)

    const supplierBefore = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplierBefore) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    const updateData: Record<string, unknown> = {}
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.domain !== undefined) updateData.domain = payload.domain
    if (payload.category !== undefined) updateData.category = payload.category
    if (payload.riskLevel !== undefined) updateData.risk_level = payload.riskLevel
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.contractEndDate !== undefined)
      updateData.contract_end_date = payload.contractEndDate
    if (payload.notes !== undefined) updateData.notes = payload.notes

    if (Object.keys(updateData).length === 0) {
      ctx.response.ok({ data: this.formatSupplier(supplierBefore) })
      return
    }

    const after = await db
      .updateTable('suppliers')
      .set(updateData)
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .returningAll()
      .executeTakeFirstOrThrow()

    ctx.response.ok({ data: this.formatSupplier(after) })
  }

  /**
   * DELETE /api/v1/suppliers/:id
   * Suppression d'un fournisseur. Accessible uniquement si le supplier appartient à l'organisation de l'utilisateur.
   */
  async destroy(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await supplierIdValidator.validate(ctx.params)

    const supplier = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplier) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    await db
      .deleteFrom('suppliers')
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .execute()

    ctx.response.ok({ message: 'Supplier deleted successfully' })
  }

  /**
   * PATCH /api/v1/suppliers/:id/risk-level
   * Mise à jour du niveau de risque uniquement.
   * Accessible avec la permission supplier:update_risk (Analyst, Admin, Owner).
   */
  async updateRiskLevel(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await supplierIdValidator.validate(ctx.params)
    const { riskLevel } = await ctx.request.validateUsing(updateRiskLevelValidator)

    const supplier = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplier) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    const updated = await db
      .updateTable('suppliers')
      .set({ risk_level: riskLevel as RiskLevel })
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .returningAll()
      .executeTakeFirstOrThrow()

    ctx.response.ok({ data: this.formatSupplier(updated) })
  }

  /**
   * PATCH /api/v1/suppliers/:id/notes
   * Mise à jour des notes uniquement.
   * Accessible avec la permission supplier:add_notes (Analyst, Admin, Owner).
   */
  async updateNotes(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const { id } = await supplierIdValidator.validate(ctx.params)
    const { notes } = await ctx.request.validateUsing(updateNotesValidator)

    const supplier = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplier) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    const updated = await db
      .updateTable('suppliers')
      .set({ notes })
      .where('id', '=', id)
      .where('organization_id', '=', user.organizationId)
      .returningAll()
      .executeTakeFirstOrThrow()

    ctx.response.ok({ data: this.formatSupplier(updated) })
  }

  /**
   * GET /api/v1/suppliers/:supplierId/audit-logs
   * Récupère l'historique des audits d'un supplier spécifique
   */
  async auditLogs(ctx: HttpContext): Promise<void> {
    const user = getAuthUser(ctx)
    const supplierId = ctx.params.supplierId as string
    const query = await ctx.request.validateUsing(listAuditLogsValidator)

    const supplier = await db
      .selectFrom('suppliers')
      .select('id')
      .where('id', '=', supplierId)
      .where('organization_id', '=', user.organizationId)
      .executeTakeFirst()

    if (!supplier) {
      ctx.response.notFound({
        error: 'NOT_FOUND',
        message: 'Supplier not found',
      })
      return
    }

    const page = query.page ?? DEFAULT_PAGE
    const limit = query.limit ?? DEFAULT_PAGE_SIZE
    const sortBy = query.sortBy ?? 'created_at'
    const sortOrder = query.sortOrder ?? 'desc'
    const offset = (page - 1) * limit

    let baseQuery = db
      .selectFrom('audit_logs')
      .innerJoin('users', 'users.id', 'audit_logs.user_id')
      .where('users.organization_id', '=', user.organizationId)
      .where('audit_logs.entity_type', '=', 'supplier')
      .where('audit_logs.entity_id', '=', supplierId)

    const countResult = await baseQuery
      .select(db.fn.countAll().as('total'))
      .executeTakeFirstOrThrow()

    const total = Number(countResult.total)

    const logs = await baseQuery
      .select([
        'audit_logs.id',
        'audit_logs.user_id',
        'audit_logs.action',
        'audit_logs.entity_type',
        'audit_logs.entity_id',
        'audit_logs.before',
        'audit_logs.after',
        'audit_logs.ip_address',
        'audit_logs.created_at',
        'users.email as user_email',
        'users.full_name as user_full_name',
      ])
      .orderBy(`audit_logs.${sortBy}`, sortOrder)
      .offset(offset)
      .limit(limit)
      .execute()

    const lastPage = Math.ceil(total / limit) || 1

    ctx.response.ok({
      data: logs.map((log) => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.user_email,
        userFullName: log.user_full_name,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        before: log.before,
        after: log.after,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      })),
      meta: {
        total,
        page,
        lastPage,
        perPage: limit,
      },
    })
  }

  private formatSupplier(supplier: {
    id: string
    name: string
    domain: string
    category: string
    risk_level: string
    status: string
    contract_end_date: Date | null
    notes: string | null
    organization_id: string
    ai_risk_score: number | null
    ai_analysis: Record<string, unknown> | null
    created_at: Date
  }): Record<string, unknown> {
    return {
      id: supplier.id,
      name: supplier.name,
      domain: supplier.domain,
      category: supplier.category,
      riskLevel: supplier.risk_level,
      status: supplier.status,
      contractEndDate: supplier.contract_end_date,
      notes: supplier.notes,
      organizationId: supplier.organization_id,
      aiRiskScore: supplier.ai_risk_score,
      aiAnalysis: supplier.ai_analysis,
      createdAt: supplier.created_at,
    }
  }
}
