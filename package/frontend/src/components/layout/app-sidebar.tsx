'use client'

import * as React from 'react'
import { Command, Warehouse, Users } from 'lucide-react'

import { NavMain, type INavItem } from '@/components/layout/nav-main'
import { NavSecondary } from '@/components/layout/nav-secondary'
import { NavUser } from '@/components/layout/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/use-permissions'

const navMainItems: INavItem[] = [
  {
    title: 'Suppliers',
    url: '/',
    icon: Warehouse,
  },
]

function getNavSecondaryItems(canManageUsers: boolean): INavItem[] {
  const items: INavItem[] = []

  if (canManageUsers) {
    items.push({
      title: 'Users',
      url: '/users',
      icon: Users,
    })
  }

  return items
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth()
  const { can } = usePermissions()

  const user = {
    name: authUser?.fullName || '',
    email: authUser?.email || '',
  }

  const navSecondaryItems = getNavSecondaryItems(can('user:manage'))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Mindlapse</span>
                  <span className="truncate text-xs">Test technique</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
