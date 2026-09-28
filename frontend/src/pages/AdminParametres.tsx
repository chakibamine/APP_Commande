import { type FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import type { StaffProfil } from '../types.ts'

type Onglet = 'profil' | 'securite'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE: 'Gestionnaire',
}

function moisAnnee(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(value),
  )
}

export function AdminParametres() {
  const { request, updateProfil } = useAuth()
  const [profil, setProfil] = useState<StaffProfil | null>(null)
  const [onglet, setOnglet] = useState<Onglet>('profil')
  const [nom, setNom] = useState('')
  const [motDePasseActuel, setMotDePasseActuel] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    request<StaffProfil>('/utilisateurs/me')
      .then((data) => {
        if (!active) return
        setProfil(data)
        setNom(data.nom)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Profil indisponible')
      })
    return () => {
      active = false
    }
  }, [request])

  async function save(body: Record<string, string>, message: string) {
    setBusy(true)
    setError('')
    setSaved('')
    try {
      const updated = await request<StaffProfil>('/utilisateurs/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setProfil(updated)
      setNom(updated.nom)
      updateProfil(updated)
      setSaved(message)
      return true
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement refusé')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function onSaveProfil(event: FormEvent) {
    event.preventDefault()
    await save({ nom }, 'Profil mis à jour.')
  }

  async function onSavePassword(event: FormEvent) {
    event.preventDefault()
    if (motDePasse !== confirmation) {
      setSaved('')
      setError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    const ok = await save({ motDePasseActuel, motDePasse }, 'Mot de passe modifié.')
    if (ok) {
      setMotDePasseActuel('')
      setMotDePasse('')
      setConfirmation('')
    }
  }

  if (!profil) {
    return error ? <p className="alert">{error}</p> : <p className="muted">Chargement…</p>
  }

  const initiale = profil.nom.trim().charAt(0).toUpperCase() || '?'
  const role = ROLE_LABEL[profil.role] ?? profil.role

  return (
    <section className="settings-page">
      <header>
        <h1>Paramètres</h1>
        <p className="muted">Votre profil et la sécurité de votre compte back-office.</p>
      </header>

      <nav className="settings-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={onglet === 'profil'}
          className={onglet === 'profil' ? 'active' : ''}
          onClick={() => setOnglet('profil')}
        >
          Profil
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={onglet === 'securite'}
          className={onglet === 'securite' ? 'active' : ''}
          onClick={() => setOnglet('securite')}
        >
          Sécurité
        </button>
      </nav>

      {error && <p className="alert">{error}</p>}
      {saved && <p className="notice">{saved}</p>}

      <div className="settings-grid">
        <aside className="settings-side">
          <article className="settings-card settings-id">
            <span className="settings-avatar">{initiale}</span>
            <strong>{profil.nom}</strong>
            <span className="role-chip">{role}</span>
            <span className="muted">Membre depuis {moisAnnee(profil.createdAt)}</span>
            <dl>
              <div>
                <dt>Email de connexion</dt>
                <dd>{profil.email}</dd>
              </div>
            </dl>
          </article>
          <article className="settings-perm">
            <strong>Niveau d’accès</strong>
            <p>
              Rôle <b>{role}</b> : commandes, produits et clients. L’email de connexion et le
              rôle sont gérés par l’administration.
            </p>
          </article>
        </aside>

        {onglet === 'profil' ? (
          <form className="settings-main" onSubmit={(event) => void onSaveProfil(event)}>
            <article className="settings-card">
              <h2>Identité</h2>
              <p className="muted">Nom affiché dans le back-office.</p>
              <div className="settings-fields">
                <label className="wide">
                  Nom complet
                  <input value={nom} onChange={(event) => setNom(event.target.value)} required />
                </label>
                <label className="wide">
                  Email de connexion
                  <input value={profil.email} readOnly disabled />
                  <small>Contactez un administrateur pour changer cet email.</small>
                </label>
                <label>
                  Rôle
                  <input value={role} readOnly disabled />
                </label>
                <label>
                  Identifiant
                  <input value={profil.id.slice(0, 8).toUpperCase()} readOnly disabled />
                </label>
              </div>
            </article>
            <div className="settings-save">
              <button className="btn" type="submit" disabled={busy || nom.trim() === profil.nom}>
                Enregistrer le profil
              </button>
            </div>
          </form>
        ) : (
          <form className="settings-main" onSubmit={(event) => void onSavePassword(event)}>
            <article className="settings-card">
              <h2>Mot de passe</h2>
              <p className="muted">Au moins 8 caractères. Le mot de passe actuel est requis.</p>
              <div className="settings-fields">
                <label className="wide">
                  Mot de passe actuel
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={motDePasseActuel}
                    onChange={(event) => setMotDePasseActuel(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Nouveau mot de passe
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={motDePasse}
                    onChange={(event) => setMotDePasse(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Confirmation
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                  />
                </label>
              </div>
            </article>
            <div className="settings-save">
              <button className="btn" type="submit" disabled={busy}>
                Changer le mot de passe
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
