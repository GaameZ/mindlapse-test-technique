import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <div className='bg-red-500'>Hello "__root"!</div>
      <Outlet />
    </React.Fragment>
  )
}
