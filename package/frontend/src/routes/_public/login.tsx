import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/_public/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <LoginForm />
    </div>
  )
}
