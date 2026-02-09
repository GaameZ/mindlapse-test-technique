import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '@/providers/ThemeProvider'

export const Route = createFileRoute('/_public')({
  component: PublicLayoutComponent,
})

function PublicLayoutComponent() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Outlet />
      </div>
    </ThemeProvider>
  )
}
