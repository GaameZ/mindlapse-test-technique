import { createFileRoute } from '@tanstack/react-router'
import { SupplierDetail } from '@/components/suppliers/supplier-detail'

export const Route = createFileRoute('/_authenticated/suppliers/$supplierId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { supplierId } = Route.useParams()

  return <SupplierDetail supplierId={supplierId} />
}
