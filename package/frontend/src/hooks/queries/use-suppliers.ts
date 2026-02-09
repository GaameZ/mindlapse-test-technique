import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { PaginationParams } from '@/lib/api/types'

export function useSuppliers(params?: PaginationParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => apiClient.getSuppliers(searchParams),
    staleTime: 1 * 60 * 1000,
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => apiClient.getSupplier(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useSupplierAuditLogs(supplierId: string, params?: PaginationParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  return useQuery({
    queryKey: ['suppliers', supplierId, 'audit-logs', params],
    queryFn: () => apiClient.getSupplierAuditLogs(supplierId, searchParams),
    staleTime: 30 * 1000,
    enabled: !!supplierId,
  })
}
