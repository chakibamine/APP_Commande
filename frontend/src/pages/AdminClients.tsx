import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { Pager } from '../components/Pager.tsx'
import { formatDate } from '../format.ts'
import type { ClientProfil, Paginated } from '../types.ts'

const VIDE = { nom: '', telephone: '', email: '', adresse: '', motDePasse: '' }

type ClientForm = typeof VIDE

function formDe(client: ClientProfil): ClientForm {
  return {
    nom: client.nom,
    telephone: client.telephone,
    email: client.email ?? '',
    adresse: client.adresse,
    motDePasse: '',
  }
}

function useClientActions() {
  const { request } = useAuth()

  async function save(form: ClientForm, id: string | null) {
    const body: Record<string, string | null> = {
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      adresse: form.adresse.trim(),
    }
    const email = form.email.trim()
    if (id) {
      body.email = email || null
      if (form.motDePasse) body.motDePasse = form.motDePasse
    } else {
      if (email) body.email = email
      body.motDePasse = form.motDePasse
    }
    return request<ClientProfil>(id ? `/clients/${id}` : '/clients', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    })
  }

  async function remove(client: ClientProfil) {
    if (!window.confirm(`Supprimer le client « ${client.nom} » ?`)) return false
    await request(`/clients/${client.id}`, { method: 'DELETE' })
    return true
  }

  return { save, remove }
}

function ClientFormPanel({
  clientId,
  initial,
  onSaved,
  onCancel,
}: {
  clientId: string | null
  initial: ClientForm
  onSaved: (client: ClientProfil) => void
  onCancel: () => void
}) {
  const { save } = useClientActions()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = clientId !== null

  function setField(key: keyof ClientForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      onSaved(await save(form, clientId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement refusé')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="products-form" onSubmit={(event) => void onSubmit(event)}>
      <h2>{editing ? 'Modifier le client' : 'Nouveau client'}</h2>
      {error && <p className="alert">{error}</p>}
      <div className="form-grid">
        <label>
          Nom
          <input value={form.nom} onChange={(event) => setField('nom', event.target.value)} required />
        </label>
        <label>
          Téléphone
          <input
            type="tel"
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
          {editing ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe (8 caractères min.)'}
          <input
            type="text"
            minLength={8}
            value={form.motDePasse}
            onChange={(event) => setField('motDePasse', event.target.value)}
            required={!editing}
            placeholder={editing ? 'Laisser vide pour ne pas changer' : ''}
            autoComplete="new-password"
          />
        </label>
      </div>
      <div className="actions">
        <button className="btn" type="submit" disabled={busy}>
          {editing ? 'Enregistrer' : 'Créer le client'}
        </button>
        <button className="btn line" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export function AdminClients() {
  const { request } = useAuth()
  const { remove } = useClientActions()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<ClientProfil> | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ClientProfil | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = useCallback(
    () => request<Paginated<ClientProfil>>(`/clients?page=${page}&limit=10`).then(setResult),
    [request, page],
  )

  useEffect(() => {
    reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    })
  }, [reload])

  function openCreate() {
    setEditing(null)
    setCreating(true)
    setNotice('')
  }

  function openEdit(client: ClientProfil) {
    setMenuId(null)
    setCreating(false)
    setEditing(client)
    setNotice('')
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
  }

  async function onSaved(client: ClientProfil, created: boolean) {
    closeForm()
    setNotice(created ? `Client « ${client.nom} » créé.` : `Client « ${client.nom} » modifié.`)
    await reload()
  }

  async function onDelete(client: ClientProfil) {
    setMenuId(null)
    setError('')
    setNotice('')
    try {
      if (await remove(client)) {
        setNotice(`Client « ${client.nom} » supprimé.`)
        await reload()
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression refusée')
    }
  }

  const clients = result?.data ?? []
  const terme = search.trim().toLowerCase()
  const visibles = terme
    ? clients.filter(
        (client) =>
          client.nom.toLowerCase().includes(terme) ||
          client.telephone.includes(terme) ||
          (client.email ?? '').toLowerCase().includes(terme),
      )
    : clients

  return (
    <section className="products-page">
      <header className="products-head">
        <div>
          <h1>Clients</h1>
          <p className="muted">Comptes utilisés pour se connecter à l’application mobile.</p>
        </div>
        <button type="button" className="btn" onClick={openCreate}>
          + Ajouter un client
        </button>
      </header>

      {error && <p className="alert">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      {(creating || editing) && (
        <ClientFormPanel
          key={editing?.id ?? 'nouveau'}
          clientId={editing?.id ?? null}
          initial={editing ? formDe(editing) : VIDE}
          onSaved={(client) => void onSaved(client, creating)}
          onCancel={closeForm}
        />
      )}

      <div className="products-table">
        <div className="products-toolbar">
          <input
            type="search"
            placeholder="Rechercher par nom, téléphone ou email…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="muted">
            {result ? `${result.meta.total} client${result.meta.total > 1 ? 's' : ''}` : ''}
          </span>
        </div>
        {!result ? (
          <p className="muted">Chargement…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Adresse</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <span className="product-mark">
                        {client.nom.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    </td>
                    <td>
                      <strong>{client.nom}</strong>
                      <em>Créé le {formatDate(client.createdAt)}</em>
                    </td>
                    <td>{client.telephone}</td>
                    <td>{client.email ?? '—'}</td>
                    <td>{client.adresse}</td>
                    <td className="row-menu">
                      <button
                        type="button"
                        aria-label={`Actions pour ${client.nom}`}
                        onClick={() => setMenuId(menuId === client.id ? null : client.id)}
                      >
                        ⋯
                      </button>
                      {menuId === client.id && (
                        <div className="row-menu-list">
                          <Link to={`/admin/clients/${client.id}`}>Fiche</Link>
                          <button type="button" onClick={() => openEdit(client)}>
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => void onDelete(client)}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Aucun client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {result && !terme && <Pager meta={result.meta} onPage={setPage} />}
      </div>
    </section>
  )
}

export function AdminClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { request } = useAuth()
  const { remove } = useClientActions()
  const [client, setClient] = useState<ClientProfil | null>(null)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    request<ClientProfil>(`/clients/${id}`)
      .then((data) => {
        if (active) setClient(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Client introuvable')
        }
      })
    return () => {
      active = false
    }
  }, [request, id])

  async function onDelete() {
    if (!client) return
    setError('')
    try {
      if (await remove(client)) navigate('/admin/clients')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression refusée')
    }
  }

  if (!client) {
    return (
      <section>
        {error ? <p className="alert">{error}</p> : <p className="muted">Chargement…</p>}
      </section>
    )
  }

  return (
    <section className="narrow">
      <Link className="back-link" to="/admin/clients">
        Retour aux clients
      </Link>
      <header className="page-head">
        <div>
          <p className="eyebrow">Fiche client</p>
          <h1>{client.nom}</h1>
        </div>
        {!editing && (
          <div className="actions">
            <button type="button" className="btn line" onClick={() => setEditing(true)}>
              Modifier
            </button>
            <button type="button" className="btn danger" onClick={() => void onDelete()}>
              Supprimer
            </button>
          </div>
        )}
      </header>
      {error && <p className="alert">{error}</p>}
      {notice && <p className="notice">{notice}</p>}
      {editing ? (
        <ClientFormPanel
          clientId={client.id}
          initial={formDe(client)}
          onSaved={(updated) => {
            setClient(updated)
            setEditing(false)
            setNotice('Client modifié.')
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <dl className="facts">
          <div>
            <dt>Téléphone</dt>
            <dd>{client.telephone}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{client.email ?? '—'}</dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>{client.adresse}</dd>
          </div>
          <div>
            <dt>Créé le</dt>
            <dd>{formatDate(client.createdAt)}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
