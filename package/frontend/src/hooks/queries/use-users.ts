import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

interface UseUsersParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  role?: string
}

export function useUsers(params: UseUsersParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params.role) searchParams.set('role', params.role)

  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.getUsers(searchParams),
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.getUser(id!),
    enabled: !!id,
  })
}
