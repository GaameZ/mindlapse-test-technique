import { AlertTriangle } from 'lucide-react'
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

interface DeleteOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteOrganizationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2">
              <p className="font-bold">
                This will permanently delete your organization and ALL associated data:
              </p>
              <ul className="list-disc list-inside flex flex-col gap-1 text-sm">
                <li>All users in the organization</li>
                <li>All suppliers</li>
                <li>All audit logs</li>
                <li>All AI analysis data</li>
              </ul>
              <p className="font-bold text-destructive mt-4">
                This action is IRREVERSIBLE. Are you absolutely sure?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} variant="destructive">
            {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
