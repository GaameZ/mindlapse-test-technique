import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'

interface UsersEmptyStateProps {
  onAddUser: () => void
}

export function UsersEmptyState({ onAddUser }: UsersEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users className="size-6" />
        </EmptyMedia>
        <EmptyTitle>No users found</EmptyTitle>
        <EmptyDescription>
          Get started by adding your first user to the organization.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add Your First User
        </Button>
      </EmptyContent>
    </Empty>
  )
}
