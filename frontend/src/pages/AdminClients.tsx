import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { Pager } from '../components/Pager.tsx'
import { formatDate } from '../format.ts'
import type { ClientProfil, Paginated } from '../types.ts'

export function AdminClients() {
  const { request } = useAuth()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<ClientProfil> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request<Paginated<ClientProfil>>(`/clients?page=${page}&limit=10`)
      .then((data) => {
        if (active) setResult(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Chargement impossible')
        }
      })
    return () => {
      active = false
    }
  }, [request, page])

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back-office</p>
          <h1>Clients</h1>
        </div>
      </header>
      {error && <p className="alert">{error}</p>}
      {!result ? (
        <p className="muted">Chargement…</p>
      ) : result.data.length === 0 ? (
        <p className="muted">Aucun client.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((client) => (
                  <tr key={client.id}>
                    <td>{client.nom}</td>
                    <td>{client.telephone}</td>
                    <td>{client.email ?? '—'}</td>
                    <td>
                      <Link to={`/admin/clients/${client.id}`}>Fiche</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager meta={result.meta} onPage={setPage} />
        </>
      )}
    </section>
  )
}

export function AdminClientDetail() {
  const { id } = useParams()
  const { request } = useAuth()
  const [client, setClient] = useState<ClientProfil | null>(null)
  const [error, setError] = useState('')

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

  if (!client) {
    return (
      <section>
        {error ? <p className="alert">{error}</p> : <p className="muted">Chargement…</p>}
      </section>
    )
  }

  return (
    <section className="narrow">
      <p className="fine">
        <Link to="/admin/clients">Retour aux clients</Link>
      </p>
      <header className="page-head">
        <div>
          <p className="eyebrow">Fiche client</p>
          <h1>{client.nom}</h1>
        </div>
      </header>
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
          <dt>Inscrit le</dt>
          <dd>{formatDate(client.createdAt)}</dd>
        </div>
      </dl>
    </section>
  )
}
