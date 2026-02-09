import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

interface LogoutOptions {
  redirectTo?: string
}

export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (options?: LogoutOptions) => {
      logout()
      return options
    },
    onSuccess: (options) => {
      const redirectTo = options?.redirectTo || '/login'
      navigate({ to: redirectTo as '/login' })
    },
  })
}
