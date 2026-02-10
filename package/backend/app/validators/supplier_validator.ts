import vine from '@vinejs/vine'
import { NOTES_REGEX, NOTES_MAX_LENGTH } from '@mindlapse/shared'

export const createSupplierValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    domain: vine.string().trim().minLength(1).maxLength(255),
    category: vine.enum(['saas', 'infrastructure', 'consulting', 'other']),
    riskLevel: vine.enum(['critical', 'high', 'medium', 'low']),
    status: vine.enum(['active', 'under_review', 'inactive']),
    contractEndDate: vine.string().optional(),
    notes: vine.string().trim().maxLength(NOTES_MAX_LENGTH).regex(NOTES_REGEX).optional(),
  })
)

export const updateSupplierValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    domain: vine.string().trim().minLength(1).maxLength(255).optional(),
    category: vine.enum(['saas', 'infrastructure', 'consulting', 'other']).optional(),
    riskLevel: vine.enum(['critical', 'high', 'medium', 'low']).optional(),
    status: vine.enum(['active', 'under_review', 'inactive']).optional(),
    contractEndDate: vine.string().optional().nullable(),
    notes: vine
      .string()
      .trim()
      .maxLength(NOTES_MAX_LENGTH)
      .regex(NOTES_REGEX)
      .optional()
      .nullable(),
  })
)

export const listSuppliersValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sortBy: vine
      .enum(['name', 'domain', 'category', 'risk_level', 'status', 'created_at'])
      .optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
    search: vine.string().trim().maxLength(255).optional(),
    category: vine.enum(['saas', 'infrastructure', 'consulting', 'other']).optional(),
    riskLevel: vine.enum(['critical', 'high', 'medium', 'low']).optional(),
    status: vine.enum(['active', 'under_review', 'inactive']).optional(),
  })
)

export const supplierIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

export const updateRiskLevelValidator = vine.compile(
  vine.object({
    riskLevel: vine.enum(['critical', 'high', 'medium', 'low']),
  })
)

export const updateNotesValidator = vine.compile(
  vine.object({
    notes: vine.string().trim().maxLength(NOTES_MAX_LENGTH).regex(NOTES_REGEX),
  })
)
