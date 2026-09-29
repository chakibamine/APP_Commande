import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.tsx'

export function Layout() {
  const { session, logout } = useAuth()

  return (
    <div className="staff-shell">
      <aside className="staff-side">
        <Link className="staff-brand" to="/admin">
          <span className="staff-logo">B</span>
          <span>BGI Commandes</span>
        </Link>
        <nav className="staff-nav">
          <NavLink to="/admin" end>
            Tableau de bord
          </NavLink>
          <NavLink to="/admin/commandes">Commandes</NavLink>
          <NavLink to="/admin/produits">Produits</NavLink>
          <NavLink to="/admin/clients">Clients</NavLink>
          <NavLink to="/admin/parametres">Paramètres</NavLink>
        </nav>
        <button type="button" className="staff-logout" onClick={logout}>
          Déconnexion
        </button>
      </aside>
      <div className="staff-body">
        <header className="staff-top">
          <span>Back-office</span>
          <strong>{session?.profil.nom}</strong>
        </header>
        <main className="staff-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
