import { createFileRoute } from '@tanstack/react-router'
import { SuppliersTable } from '@/components/suppliers/suppliers-table'
import { CreateSupplierDialog } from '@/components/suppliers/create-supplier-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { z } from 'zod'
import { SUPPLIER_CATEGORIES, RISK_LEVELS, SUPPLIER_STATUSES } from '@/lib/supplier-enums'

const suppliersSearchSchema = z.object({
  page: z.number().int().positive().optional().catch(1),
  search: z.string().optional().catch(undefined),
  category: z.enum(SUPPLIER_CATEGORIES).optional().catch(undefined),
  riskLevel: z.enum(RISK_LEVELS).optional().catch(undefined),
  status: z.enum(SUPPLIER_STATUSES).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: suppliersSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { can } = usePermissions()

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your organization's suppliers and assess cyber risks
          </p>
        </div>
        {can('supplier:create') && <CreateSupplierDialog />}
      </div>
      <SuppliersTable />
    </div>
  )
}
