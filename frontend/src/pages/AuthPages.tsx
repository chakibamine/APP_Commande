import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { homeFor } from '../components/Guards.tsx'
import type { Session } from '../types.ts'

function AuthCard({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children: ReactNode
}) {
  return (
    <section className="auth-card">
      <p className="eyebrow">Dépôt pétrolier</p>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
    </section>
  )
}

export function LoginClient() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const session = await api<Session>('/auth/login-client', {
        method: 'POST',
        body: JSON.stringify({ telephone, motDePasse }),
      })
      login(session)
      navigate(homeFor(session.type))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible')
    }
  }

  return (
    <AuthCard
      title="Connexion client"
      lead="Consultez le catalogue et passez vos commandes."
    >
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="alert">{error}</p>}
        <label>
          Téléphone
          <input
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(event) => setMotDePasse(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn" type="submit">
          Se connecter
        </button>
      </form>
      <p className="fine">
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </AuthCard>
  )
}

export function RegisterClient() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    motDePasse: '',
  })
  const [error, setError] = useState('')

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const body: Record<string, string> = {
      nom: form.nom,
      telephone: form.telephone,
      adresse: form.adresse,
      motDePasse: form.motDePasse,
    }
    if (form.email) body.email = form.email
    try {
      const session = await api<Session>('/auth/register-client', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      login(session)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible')
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      lead="Un téléphone, une adresse, et vous pouvez commander."
    >
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="alert">{error}</p>}
        <label>
          Nom
          <input
            value={form.nom}
            onChange={(event) => setField('nom', event.target.value)}
            required
          />
        </label>
        <label>
          Téléphone
          <input
            value={form.telephone}
            onChange={(event) => setField('telephone', event.target.value)}
            required
          />
        </label>
        <label>
          Email (optionnel)
          <input
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        </label>
        <label>
          Adresse
          <input
            value={form.adresse}
            onChange={(event) => setField('adresse', event.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe (8 caractères minimum)
          <input
            type="password"
            minLength={8}
            value={form.motDePasse}
            onChange={(event) => setField('motDePasse', event.target.value)}
            required
          />
        </label>
        <button className="btn" type="submit">
          Créer le compte
        </button>
      </form>
      <p className="fine">
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </AuthCard>
  )
}

export function LoginAdmin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const session = await api<Session>('/auth/login-admin', {
        method: 'POST',
        body: JSON.stringify({ email, motDePasse }),
      })
      login(session)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible')
    }
  }

  return (
    <AuthCard
      title="Espace back-office"
      lead="Administrateurs et gestionnaires."
    >
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="alert">{error}</p>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={motDePasse}
            onChange={(event) => setMotDePasse(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn" type="submit">
          Entrer
        </button>
      </form>
      <p className="fine">
        Vous êtes client ? <Link to="/connexion">Connexion client</Link>
      </p>
    </AuthCard>
  )
}
