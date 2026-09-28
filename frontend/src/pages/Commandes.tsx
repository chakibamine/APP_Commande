import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { Pager } from '../components/Pager.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, formatMoney } from '../format.ts'
import type { Commande, Paginated } from '../types.ts'

export function Commandes() {
  const { request } = useAuth()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Paginated<Commande> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request<Paginated<Commande>>(`/commandes/mes-commandes?page=${page}&limit=10`)
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
          <p className="eyebrow">Historique</p>
          <h1>Mes commandes</h1>
        </div>
      </header>
      {error && <p className="alert">{error}</p>}
      {!result ? (
        <p className="muted">Chargement…</p>
      ) : result.data.length === 0 ? (
        <p className="muted">Aucune commande pour le moment.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((commande) => (
                  <tr key={commande.id}>
                    <td>{formatDate(commande.dateCommande)}</td>
                    <td>
                      <StatusBadge statut={commande.statut} />
                    </td>
                    <td>{formatMoney(commande.montantTotal)}</td>
                    <td>
                      <Link to={`/commandes/${commande.id}`}>Détail</Link>
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
