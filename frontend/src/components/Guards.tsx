import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import type { TokenType } from '../types.ts'

export function homeFor(type: TokenType): string {
  return type === 'STAFF' ? '/admin' : '/'
}

export function RequireRole({ role }: { role: TokenType }) {
  const { session } = useAuth()
  if (!session) {
    return (
      <Navigate
        to={role === 'STAFF' ? '/admin/connexion' : '/connexion'}
        replace
      />
    )
  }
  if (session.type !== role) {
    return <Navigate to={homeFor(session.type)} replace />
  }
  return <Outlet />
}

export function GuestOnly() {
  const { session } = useAuth()
  if (session) return <Navigate to={homeFor(session.type)} replace />
  return <Outlet />
}
