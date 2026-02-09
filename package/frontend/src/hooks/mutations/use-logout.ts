import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

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
      toast.success('Logged out successfully', {
        description: 'See you soon!',
      })

      const redirectTo = options?.redirectTo || '/login'
      navigate({ to: redirectTo as '/login' })
    },
    onError: (error) => {
      toast.error('Logout failed', {
        description: error.message,
      })
    },
  })
}
