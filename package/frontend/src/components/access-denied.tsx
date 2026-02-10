import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'

interface AccessDeniedProps {
  onBack?: () => void
}

export function AccessDenied({ onBack }: AccessDeniedProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ArrowLeft className="size-6" />
          </EmptyMedia>
          <EmptyTitle className="text-destructive">Access Denied</EmptyTitle>
          <EmptyDescription>You don't have permission to access this page.</EmptyDescription>
        </EmptyHeader>
        {onBack && (
          <EmptyContent>
            <Button onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </div>
  )
}
