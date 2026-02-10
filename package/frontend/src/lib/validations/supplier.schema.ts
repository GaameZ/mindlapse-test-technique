import { z } from 'zod'
import { SUPPLIER_CATEGORIES, RISK_LEVELS, SUPPLIER_STATUSES } from '@/lib/supplier-enums'

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
  category: z.enum(SUPPLIER_CATEGORIES as [string, ...string[]], {
    message: 'Please select a valid category',
  }),
  riskLevel: z.enum(RISK_LEVELS as [string, ...string[]], {
    message: 'Please select a valid risk level',
  }),
  status: z.enum(SUPPLIER_STATUSES as [string, ...string[]], {
    message: 'Please select a valid status',
  }),
  contractEndDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const parsed = new Date(date)
        return !isNaN(parsed.getTime())
      },
      { message: 'Invalid date format' }
    ),
  notes: z.string().max(5000, 'Notes are too long (max 5000 characters)').optional(),
})

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>

export const updateSupplierSchema = createSupplierSchema.partial()

export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>
