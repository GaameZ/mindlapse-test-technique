import { createFileRoute } from '@tanstack/react-router'
import { SuppliersTable } from '@/components/suppliers/suppliers-table'

export const Route = createFileRoute('/_authenticated/')({
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
