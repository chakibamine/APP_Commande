import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { isStaffProfil } from '../types.ts'

export function Layout() {
  const { session, logout } = useAuth()
  const staff = session?.type === 'STAFF'

  if (staff && session) {
    return (
      <div className="staff-shell">
        <aside className="staff-side">
          <Link className="staff-brand" to="/admin">
            <span className="staff-logo">D</span>
            <span>Dépôt</span>
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
            <strong>{session.profil.nom}</strong>
          </header>
          <main className="staff-main">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">Dépôt</span>
          <span className="brand-sub">Produits pétroliers</span>
        </Link>
        <nav className="nav">
          {session?.type === 'CLIENT' && (
            <>
              <NavLink to="/" end>
                Catalogue
              </NavLink>
              <NavLink to="/commandes">Mes commandes</NavLink>
              <NavLink to="/profil">Profil</NavLink>
            </>
          )}
          {!session && (
            <>
              <NavLink to="/connexion">Connexion</NavLink>
              <NavLink to="/admin/connexion">Espace admin</NavLink>
            </>
          )}
        </nav>
        {session && (
          <div className="session">
            <span>
              {session.profil.nom}
              {isStaffProfil(session.profil) ? ` · ${session.profil.role}` : ''}
            </span>
            <button type="button" className="btn ghost" onClick={logout}>
              Déconnexion
            </button>
          </div>
        )}
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
