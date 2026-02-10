import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/components/users'

export const Route = createFileRoute('/_authenticated/users/')({
  component: Users,
})
