import { z } from 'zod'
import { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'

export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Supplier name is required')
    .min(2, 'Supplier name must be at least 2 characters')
    .max(255, 'Supplier name is too long'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Invalid domain format (e.g., example.com)'),
  category: z.enum(SupplierCategory, {
    message: 'Please select a valid category',
  }),
  riskLevel: z.enum(RiskLevel, {
    message: 'Please select a valid risk level',
  }),
  status: z.enum(SupplierStatus, {
    message: 'Please select a valid status',
  }),
  contractEndDate: z
    .string()
    .nullable()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      { message: 'Invalid date format' }
    ),
  notes: z.string().max(5000, 'Notes are too long (max 5000 characters)').nullable().optional(),
})

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>

export const updateSupplierSchema = createSupplierSchema.partial()

export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>
