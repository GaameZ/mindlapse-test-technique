import db from '#config/database'
import { AuditAction } from '@mindlapse/shared'

export default class AuditService {
  static async log(params: {
    userId: string
    action: AuditAction
    entityType: string
    entityId: string
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
    ipAddress: string
  }): Promise<void> {
    await db
      .insertInto('audit_logs')
      .values({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        before: params.before ? JSON.stringify(params.before) : null,
        after: params.after ? JSON.stringify(params.after) : null,
        ip_address: params.ipAddress,
      })
      .execute()
  }
}
