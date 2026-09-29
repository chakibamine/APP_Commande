import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

export function RequireStaff() {
  const { session } = useAuth()
  if (session?.type !== 'STAFF') return <Navigate to="/connexion" replace />
  return <Outlet />
}

export function GuestOnly() {
  const { session } = useAuth()
  if (session?.type === 'STAFF') return <Navigate to="/admin" replace />
  return <Outlet />
}
