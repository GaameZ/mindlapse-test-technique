import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

interface LoginCredentials {
  email: string
  password: string
}
export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      await login(email, password)
    },
    onSuccess: () => {
      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect') || '/'

      navigate({ to: redirect as '/' })
    },
    onError: (error) => {
      console.error('Login failed:', error)
    },
  })
}
