import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api.ts'
import { useAuth } from '../auth.tsx'
import type { Session } from '../types.ts'

export function LoginAdmin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await api<Session>('/auth/login-admin', {
        method: 'POST',
        body: JSON.stringify({ email, motDePasse }),
      })
      login(session)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <div className="auth-logo">
          <span className="staff-logo">B</span>
          <span>BGI Commandes</span>
        </div>
        <small>© {new Date().getFullYear()} BGI Commandes</small>
      </aside>

      <main className="auth-main">
        <div className="auth-panel">
          <div className="auth-logo auth-logo-compact">
            <span className="staff-logo">B</span>
            <span>BGI Commandes</span>
          </div>
          <header>
            <h1>Connexion</h1>
            <p className="muted">Réservé aux administrateurs et gestionnaires.</p>
          </header>
          <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
            {error && <p className="alert">{error}</p>}
            <label>
              Email professionnel
              <input
                type="email"
                placeholder=""
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              Mot de passe
              <span className="auth-password">
                <input
                  type={visible ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={(event) => setMotDePasse(event.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setVisible((current) => !current)}
                  aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {visible ? 'Masquer' : 'Afficher'}
                </button>
              </span>
            </label>
            <button className="btn auth-submit" type="submit" disabled={busy}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <p className="auth-footer">
            Les clients commandent depuis l’application mobile BGI Commandes.
          </p>
        </div>
      </main>
    </div>
  )
}
