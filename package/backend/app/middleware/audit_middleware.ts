import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuditService from '#services/audit_service'
import { AuditAction } from '@mindlapse/shared'
import db from '#config/database'
import '#types/http'

/**
 * Middleware d'audit trail pour les opérations CRUD sur les suppliers
 * Capture automatiquement les états before/after et enregistre dans audit_logs
 */
export default class AuditMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response, params } = ctx
    const user = ctx.auth?.user
    
    if (!user) return next()

    const action = this.getActionFromMethod(request.method())
    if (!action) return next()

    const supplierId = params.id
    const before = await this.getSupplierState(supplierId, user.organizationId)

    await next()

    if (response.getStatus() >= 200 && response.getStatus() < 300) {
      const entityId = action === AuditAction.CREATE ? ctx.supplierId : supplierId
      const after = action === AuditAction.DELETE 
        ? null 
        : await this.getSupplierState(entityId, user.organizationId)

      if (entityId) {
        await AuditService.log({
          userId: user.userId,
          action,
          entityType: 'supplier',
          entityId,
          before,
          after,
          ipAddress: request.ip(),
        })
      }
    }
  }

  private getActionFromMethod(method: string): AuditAction | null {
    switch (method) {
      case 'POST': return AuditAction.CREATE
      case 'PUT':
      case 'PATCH': return AuditAction.UPDATE
      case 'DELETE': return AuditAction.DELETE
      default: return null
    }
  }

  private async getSupplierState(
    supplierId: string | undefined,
    organizationId: string
  ): Promise<Record<string, unknown> | null> {
    if (!supplierId || supplierId === 'undefined') return null

    const supplier = await db
      .selectFrom('suppliers')
      .selectAll()
      .where('id', '=', supplierId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst()

    if (!supplier) return null

    return {
      id: supplier.id,
      name: supplier.name,
      domain: supplier.domain,
      category: supplier.category,
      risk_level: supplier.risk_level,
      status: supplier.status,
      contract_end_date: supplier.contract_end_date,
      notes: supplier.notes,
      ai_risk_score: supplier.ai_risk_score,
      ai_analysis: supplier.ai_analysis,
    }
  }
}
