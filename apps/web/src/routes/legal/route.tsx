import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/legal')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Outlet /></div>
}
