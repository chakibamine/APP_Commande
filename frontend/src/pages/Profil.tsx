import { type FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import type { ClientProfil } from '../types.ts'

export function Profil() {
  const { request, updateProfil } = useAuth()
  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    motDePasse: '',
  })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    request<ClientProfil>('/clients/me')
      .then((profil) => {
        if (!active) return
        setForm({
          nom: profil.nom,
          telephone: profil.telephone,
          email: profil.email ?? '',
          adresse: profil.adresse,
          motDePasse: '',
        })
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Profil indisponible')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [request])

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const body: Record<string, string> = {
      nom: form.nom,
      telephone: form.telephone,
      adresse: form.adresse,
    }
    if (form.email) body.email = form.email
    if (form.motDePasse) body.motDePasse = form.motDePasse
    try {
      const profil = await request<ClientProfil>('/clients/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      updateProfil(profil)
      setForm((current) => ({ ...current, motDePasse: '' }))
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement refusé')
    }
  }

  if (loading) return <p className="muted">Chargement…</p>

  return (
    <section className="narrow">
      <header className="page-head">
        <div>
          <p className="eyebrow">Compte</p>
          <h1>Profil</h1>
        </div>
      </header>
      <form className="stack" onSubmit={onSubmit}>
        {error && <p className="alert">{error}</p>}
        {saved && <p className="notice">Profil mis à jour.</p>}
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
          Email
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
          Nouveau mot de passe
          <input
            type="password"
            minLength={8}
            value={form.motDePasse}
            onChange={(event) => setField('motDePasse', event.target.value)}
            placeholder="Laisser vide pour ne pas changer"
          />
        </label>
        <button className="btn" type="submit">
          Enregistrer
        </button>
      </form>
    </section>
  )
}
