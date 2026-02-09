import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
