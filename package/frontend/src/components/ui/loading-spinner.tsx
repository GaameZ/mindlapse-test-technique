import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'inverted'
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  variant = 'default',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-primary border-r-transparent',
        variant === 'inverted'
          ? 'border-white dark:border-primary-foreground dark:border-r-transparent border-r-transparent'
          : '',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
