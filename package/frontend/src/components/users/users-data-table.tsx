import { type ColumnDef, type OnChangeFn } from '@tanstack/react-table'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, SortableColumnHeader } from '@/components/ui/data-table'
import { ROLE_LABELS } from '@/lib/user-roles'
import { Role } from '@mindlapse/shared'
import type { User, PaginationMeta } from '@mindlapse/shared'
import type { SortingState } from '@tanstack/react-table'

interface UsersDataTableProps {
  users: User[]
  meta?: PaginationMeta
  currentUserId?: string
  onEdit: (userId: string) => void
  onDelete: (userId: string) => void
  isDeleting: boolean
  isLoading?: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  onPageChange?: (page: number) => void
}

const getRoleBadgeVariant = (role: Role) => {
  switch (role) {
    case Role.OWNER:
      return 'destructive' as const
    case Role.ADMIN:
      return 'default' as const
    case Role.ANALYST:
      return 'secondary' as const
    case Role.AUDITOR:
      return 'outline' as const
    default:
      return 'default' as const
  }
}

export function UsersDataTable({
  users,
  meta,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting,
  isLoading = false,
  sorting,
  onSortingChange,
  onPageChange,
}: UsersDataTableProps) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => <SortableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium">{row.getValue('fullName')}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <SortableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => <div>{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <SortableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as Role
        return <Badge variant={getRoleBadgeVariant(role)}>{ROLE_LABELS[role]}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <SortableColumnHeader column={column} title="Created At" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(user.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(user.id)}
              disabled={user.id === currentUserId || isDeleting}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      meta={meta}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={onSortingChange}
      onPageChange={onPageChange}
    />
  )
}
