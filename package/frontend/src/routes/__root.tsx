import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { PageNotFound } from '@/components/not-found'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: PageNotFound,
})

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Outlet />
    </ThemeProvider>
  )
}
