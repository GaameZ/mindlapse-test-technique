import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { type SortingState } from '@tanstack/react-table'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useUsers } from '@/hooks/queries/use-users'
import { useDeleteUser, useDeleteOrganization } from '@/hooks/mutations/use-users'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/contexts/AuthContext'
import { CreateUserDialog } from './create-user-dialog'
import { UsersFilters } from './users-filters'
import { UsersDataTable } from './users-data-table'
import { UsersEmptyState } from './users-empty-state'
import { DeleteUserDialog } from './delete-user-dialog'
import { DeleteOrganizationDialog } from './delete-organization-dialog'
import { AccessDenied } from '@/components/access-denied'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@mindlapse/shared'

export function Users() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { can } = usePermissions()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showDeleteOrgDialog, setShowDeleteOrgDialog] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const params = useMemo(() => {
    const baseParams = {
      page,
      limit: DEFAULT_PAGE_SIZE,
      role: roleFilter === 'all' ? undefined : roleFilter,
    }

    if (sorting.length > 0) {
      const sort = sorting[0]
      const columnMap: Record<string, string> = {
        fullName: 'full_name',
        createdAt: 'created_at',
        email: 'email',
        role: 'role',
      }
      return {
        ...baseParams,
        sortBy: columnMap[sort.id] || sort.id,
        sortOrder: sort.desc ? ('desc' as const) : ('asc' as const),
      }
    }

    return baseParams
  }, [page, roleFilter, sorting])

  const { data, isLoading, error } = useUsers(params)

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()
  const { mutate: deleteOrganization, isPending: isDeletingOrg } = useDeleteOrganization()

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete, {
        onSuccess: () => {
          setUserToDelete(null)
        },
      })
    }
  }

  const handleDeleteOrganization = () => {
    deleteOrganization()
  }

  const handleEditUser = (userId: string) => {
    navigate({ to: `/users/${userId}` })
  }

  if (!can('user:manage')) {
    return <AccessDenied onBack={() => navigate({ to: '/' })} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users in your organization.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {can('org:delete') && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteOrgDialog(true)}
                disabled={isDeletingOrg}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Organization
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </div>
      <UsersFilters roleFilter={roleFilter} onRoleFilterChange={setRoleFilter} />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-8">
          <p>Error loading users: {error.message}</p>
        </div>
      ) : !data?.data || data.data.length === 0 ? (
        <UsersEmptyState onAddUser={() => setIsCreateDialogOpen(true)} />
      ) : (
        <UsersDataTable
          users={data.data}
          meta={data.meta}
          currentUserId={currentUser?.id}
          onEdit={handleEditUser}
          onDelete={setUserToDelete}
          isDeleting={isDeleting}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={setSorting}
          onPageChange={setPage}
        />
      )}

      <DeleteUserDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />

      <DeleteOrganizationDialog
        open={showDeleteOrgDialog}
        onOpenChange={setShowDeleteOrgDialog}
        onConfirm={handleDeleteOrganization}
        isDeleting={isDeletingOrg}
      />

      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}
