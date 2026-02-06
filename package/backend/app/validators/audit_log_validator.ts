import vine from '@vinejs/vine'

export const listAuditLogsValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sortBy: vine.enum(['created_at', 'action', 'entity_type']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
    action: vine.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
    entityType: vine.string().trim().maxLength(50).optional(),
    entityId: vine.string().uuid().optional(),
    userId: vine.string().uuid().optional(),
  })
)
