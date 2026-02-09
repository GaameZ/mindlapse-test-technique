import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from './ui/button'
import { Link } from '@tanstack/react-router'

export function PageNotFound() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist. Try searching for what you need below.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            <Button>
              <Link to="/">Go to homepage</Link>
            </Button>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  )
}
