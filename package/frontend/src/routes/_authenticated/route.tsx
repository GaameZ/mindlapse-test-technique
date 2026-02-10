import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useEffect } from 'react'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
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
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({
        to: '/login',
        search: {
          redirect: window.location.pathname,
        },
      })
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

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
