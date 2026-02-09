import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { PageNotFound } from '@/components/not-found'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: PageNotFound,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Outlet />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
