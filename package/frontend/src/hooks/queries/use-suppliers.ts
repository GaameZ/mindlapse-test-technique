import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'

export interface SuppliersParams {
  page?: number
  limit?: number
  search?: string
  category?: SupplierCategory
  riskLevel?: RiskLevel
  status?: SupplierStatus
  sortBy?: 'name' | 'domain' | 'risk_level' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export function useSuppliers(params?: SuppliersParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.search) searchParams.set('search', params.search)
  if (params?.category) searchParams.set('category', params.category)
  if (params?.riskLevel) searchParams.set('riskLevel', params.riskLevel)
  if (params?.status) searchParams.set('status', params.status)
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

export function useSupplierAuditLogs(
  supplierId: string,
  params?: Pick<SuppliersParams, 'page' | 'limit'>
) {
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
