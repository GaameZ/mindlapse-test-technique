import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useDeleteSupplier } from '@/hooks/mutations/use-suppliers'
import type { Supplier } from '@mindlapse/shared'

interface SupplierActionsProps {
  supplier: Supplier
}

export function SupplierActions({ supplier }: SupplierActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { mutate: deleteSupplier, isPending } = useDeleteSupplier()
  const navigate = useNavigate()

  const handleDelete = () => {
    deleteSupplier(supplier.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        navigate({ to: '/' })
      },
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/suppliers/$supplierId" params={{ supplierId: supplier.id }}>
        <Button variant="ghost" size="sm">
          <Eye />
          <span className="sr-only">View</span>
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 />
        <span className="sr-only">Delete</span>
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{supplier.name}</strong>? This action cannot
              be undone and will permanently remove this supplier from your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
