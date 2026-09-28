import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { Pager } from '../components/Pager.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, formatMoney } from '../format.ts'
import {
  STATUT_LABEL,
  type Commande,
  type Paginated,
  type StatutCommande,
} from '../types.ts'

const FILTRES: Array<StatutCommande | ''> = [
  '',
  'EN_ATTENTE',
  'CONFIRMEE',
  'TERMINEE',
  'ANNULEE',
]

export function AdminCommandes() {
  const { request } = useAuth()
  const [statut, setStatut] = useState<StatutCommande | ''>('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Commande> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ page: String(page), limit: '10' })
    if (statut) query.set('statut', statut)
    request<Paginated<Commande>>(`/commandes?${query.toString()}`)
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
  }, [request, page, statut])

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back-office</p>
          <h1>Commandes</h1>
        </div>
        <label className="inline-field">
          Statut
          <select
            value={statut}
            onChange={(event) => {
              setPage(1)
              setStatut(event.target.value as StatutCommande | '')
            }}
          >
            {FILTRES.map((value) => (
              <option key={value || 'tous'} value={value}>
                {value ? STATUT_LABEL[value] : 'Tous'}
              </option>
            ))}
          </select>
        </label>
      </header>
      {error && <p className="alert">{error}</p>}
      {!result ? (
        <p className="muted">Chargement…</p>
      ) : result.data.length === 0 ? (
        <p className="muted">Aucune commande.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((commande) => (
                  <tr key={commande.id}>
                    <td>{formatDate(commande.dateCommande)}</td>
                    <td>{commande.client.nom}</td>
                    <td>
                      <StatusBadge statut={commande.statut} />
                    </td>
                    <td>{formatMoney(commande.montantTotal)}</td>
                    <td>
                      <Link to={`/admin/commandes/${commande.id}`}>Traiter</Link>
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
