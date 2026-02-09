import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import type { CreateSupplierRequest, UpdateSupplierRequest } from '@/lib/api/types'

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => apiClient.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier created', {
        description: 'The supplier has been successfully added',
      })
    },
    onError: (error) => {
      toast.error('Failed to create supplier', {
        description: error.message,
      })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierRequest }) =>
      apiClient.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id, 'audit-logs'] })
      toast.success('Supplier updated', {
        description: 'The supplier has been successfully updated',
      })
    },
    onError: (error) => {
      toast.error('Failed to update supplier', {
        description: error.message,
      })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted', {
        description: 'The supplier has been successfully removed',
      })
    },
    onError: (error) => {
      toast.error('Failed to delete supplier', {
        description: error.message,
      })
    },
  })
}
