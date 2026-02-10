import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { CreateUserRequest, UpdateUserRequest } from '@/lib/api/types'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created', {
        description: 'The user has been created successfully',
      })
    },
    onError: (error) => {
      toast.error('Failed to create user', {
        description: error.message,
      })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      apiClient.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] })
      toast.success('User updated', {
        description: 'The user has been updated successfully',
      })
    },
    onError: (error) => {
      toast.error('Failed to update user', {
        description: error.message,
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted', {
        description: 'The user has been deleted successfully',
      })
    },
    onError: (error) => {
      toast.error('Failed to delete user', {
        description: error.message,
      })
    },
  })
}

export function useDeleteOrganization() {
  const { logout } = useAuth()

  return useMutation({
    mutationFn: () => apiClient.deleteCurrentOrganization(),
    onSuccess: (response) => {
      toast.success('Organization deleted', {
        description: response.message,
      })
      setTimeout(() => {
        logout()
      }, 2000)
    },
    onError: (error) => {
      toast.error('Failed to delete organization', {
        description: error.message,
      })
    },
  })
}
