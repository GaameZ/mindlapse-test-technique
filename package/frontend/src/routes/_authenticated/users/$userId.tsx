import { createFileRoute } from '@tanstack/react-router'
import { UserDetail } from '@/components/users'

export const Route = createFileRoute('/_authenticated/users/$userId')({
  component: UserDetail,
})
