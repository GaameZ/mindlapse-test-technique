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

export function useUpdateSupplierRiskLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, riskLevel }: { id: string; riskLevel: string }) =>
      apiClient.updateSupplierRiskLevel(id, riskLevel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id, 'audit-logs'] })
      toast.success('Risk level updated', {
        description: 'The risk level has been successfully updated',
      })
    },
    onError: (error) => {
      toast.error('Failed to update risk level', {
        description: error.message,
      })
    },
  })
}

export function useUpdateSupplierNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      apiClient.updateSupplierNotes(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id, 'audit-logs'] })
      toast.success('Notes updated', {
        description: 'The notes have been successfully updated',
      })
    },
    onError: (error) => {
      toast.error('Failed to update notes', {
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
