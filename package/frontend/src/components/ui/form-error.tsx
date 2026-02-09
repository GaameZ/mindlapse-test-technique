import { cn } from '@/lib/utils'

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
}

export function FormError({ message, className, ...props }: FormErrorProps) {
  if (!message) return null

  return (
    <p className={cn('text-sm text-red-500 mt-1', className)} role="alert" {...props}>
      {message}
    </p>
  )
}
