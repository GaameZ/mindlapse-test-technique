import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    // Vérification côté client : si pas de token, redirect vers /login
    const accessToken = sessionStorage.getItem('mindlapse_access_token')
    const refreshToken = localStorage.getItem('mindlapse_refresh_token')

    if (!accessToken && !refreshToken) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayoutComponent,
})

function AuthenticatedLayoutComponent() {
  const { isLoading, isAuthenticated } = useAuth()

  // Afficher un loader pendant la vérification de l'auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Si pas authentifié après le loading, on sera redirigé par beforeLoad
  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
