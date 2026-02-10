import { useParams } from '@tanstack/react-router'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/queries/use-users'
import { useUpdateUser } from '@/hooks/mutations/use-users'
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/user-roles'
import { Role } from '@mindlapse/shared'
import { FormError } from '../ui/form-error'
import { useAuth } from '@/contexts/AuthContext'

const updateUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum([Role.OWNER, Role.ADMIN, Role.ANALYST, Role.AUDITOR]),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

export function UserDetail() {
  const { user: authUser } = useAuth()
  const { userId } = useParams({ strict: false }) as { userId: string }
  const { data, isLoading, error } = useUser(userId)
  const { mutate: updateUser, isPending } = useUpdateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    values: data?.data
      ? {
          fullName: data.data.fullName,
          role: data.data.role,
        }
      : undefined,
  })

  const selectedRole = watch('role') || data?.data?.role

  const onSubmit = (formData: UpdateUserFormData) => {
    updateUser(
      {
        id: userId,
        data: formData,
      },
      {
        onSuccess: () => {
          window.location.href = '/users'
        },
      }
    )
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-destructive py-8">
          <p>Error loading user: {error?.message || 'User not found'}</p>
          <Button className="mt-4" onClick={() => (window.location.href = '/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    )
  }

  const user = data.data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 items-start">
        <Button variant="ghost" onClick={() => (window.location.href = '/users')}>
          <ArrowLeft />
          Back to Users
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Update user information and permissions</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-lg">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Current Role</Label>
              <div className="mt-1">
                <Badge variant={getRoleBadgeVariant(user.role)}>{ROLE_LABELS[user.role]}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{new Date(user.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border rounded-lg p-6 bg-card flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold">Update Information</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && <FormError id="fullName-error" message={errors.fullName.message} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Select
              disabled={userId === authUser?.id}
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as Role)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col">
                      <span className="font-medium">{ROLE_LABELS[role]}</span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <FormError id="role-error" message={errors.role.message} />}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => (window.location.href = '/users')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex flex-row gap-2 items-center">
              <Save />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
