import { createFileRoute } from '@tanstack/react-router'
import { SuppliersTable } from '@/components/suppliers/suppliers-table'
import { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'
import { z } from 'zod'

const suppliersSearchSchema = z.object({
  page: z.number().int().positive().optional().catch(1),
  search: z.string().optional().catch(undefined),
  category: z.enum(SupplierCategory).optional().catch(undefined),
  riskLevel: z.enum(RiskLevel).optional().catch(undefined),
  status: z.enum(SupplierStatus).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: suppliersSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your organization's suppliers and assess cyber risks
          </p>
        </div>
      </div>
      <SuppliersTable />
    </div>
  )
}
