import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSupplier } from '@/hooks/queries/use-suppliers'
import { useDeleteSupplier } from '@/hooks/mutations/use-suppliers'
import { EditableField } from '@/components/suppliers/editable-field'
import { SupplierAuditLogs } from '@/components/suppliers/supplier-audit-logs'
import { usePermissions } from '@/hooks/use-permissions'

interface SupplierDetailProps {
  supplierId: string
}

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const { data: supplier, isLoading, error } = useSupplier(supplierId)
  const { mutate: deleteSupplier, isPending } = useDeleteSupplier()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    deleteSupplier(supplierId, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        navigate({ to: '/' })
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg text-muted-foreground">Supplier not found</p>
        <Button onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
      </div>
    )
  }

  const supplierData = supplier.data

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{supplierData.name}</h1>
            <p className="text-muted-foreground">{supplierData.domain}</p>
          </div>
        </div>
        {can('supplier:delete') && (
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{supplierData.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? <LoadingSpinner /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-row gap-4 w-full flex-wrap">
        <div className="flex-1 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
              <CardDescription>View and edit supplier details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <EditableField
                label="Supplier Name"
                field="name"
                value={supplierData.name}
                supplierId={supplierId}
                type="text"
              />
              <EditableField
                label="Domain"
                field="domain"
                value={supplierData.domain}
                supplierId={supplierId}
                type="text"
              />
              <EditableField
                label="Category"
                field="category"
                value={supplierData.category}
                supplierId={supplierId}
                type="select"
                options="category"
              />
              <EditableField
                label="Risk Level"
                field="riskLevel"
                value={supplierData.riskLevel}
                supplierId={supplierId}
                type="select"
                options="riskLevel"
                requiredPermission="supplier:update_risk"
              />

              <EditableField
                label="Status"
                field="status"
                value={supplierData.status}
                supplierId={supplierId}
                type="select"
                options="status"
              />

              <EditableField
                label="Contract End Date"
                field="contractEndDate"
                value={supplierData.contractEndDate}
                supplierId={supplierId}
                type="date"
              />

              <EditableField
                label="Notes"
                field="notes"
                value={supplierData.notes}
                supplierId={supplierId}
                type="textarea"
                requiredPermission="supplier:add_notes"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Risk Analysis</CardTitle>
              <CardDescription>Automated risk assessment powered by AI</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">AI Risk Score</label>
                <p className="text-2xl font-bold">
                  {supplierData.aiRiskScore !== null && supplierData.aiRiskScore !== undefined
                    ? `${supplierData.aiRiskScore.toFixed(0)}/100`
                    : 'Pending'}
                </p>
              </div>
              {supplierData.aiAnalysis && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">AI Analysis</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(supplierData.aiAnalysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {can('audit:read') && (
          <div className="w-full md:w-2xs">
            <SupplierAuditLogs supplierId={supplierId} />
          </div>
        )}
      </div>
    </div>
  )
}
