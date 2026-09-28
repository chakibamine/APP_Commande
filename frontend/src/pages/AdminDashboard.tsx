import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { Pager } from '../components/Pager.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, formatMoney, formatQuantite } from '../format.ts'
import {
  STATUT_LABEL,
  type Commande,
  type Paginated,
  type StatutCommande,
} from '../types.ts'

const STATUTS: StatutCommande[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'TERMINEE',
  'ANNULEE',
]

function reference(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function isToday(value: string): boolean {
  const date = new Date(value)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function quantiteTotale(commande: Commande): number {
  return commande.lignes.reduce((total, ligne) => total + ligne.quantite, 0)
}

function exportCsv(commandes: Commande[]) {
  const lines = [
    'reference;client;produits;quantite;montant;statut;date',
    ...commandes.map((commande) =>
      [
        reference(commande.id),
        commande.client.nom,
        commande.lignes.map((ligne) => ligne.produit.nom).join(' | '),
        String(quantiteTotale(commande)),
        String(commande.montantTotal),
        STATUT_LABEL[commande.statut],
        formatDate(commande.dateCommande),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(';'),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'commandes.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminDashboard() {
  const { request } = useAuth()
  const [statut, setStatut] = useState<StatutCommande | ''>('')
  const [page, setPage] = useState(1)
  const [recherche, setRecherche] = useState('')
  const [result, setResult] = useState<Paginated<Commande> | null>(null)
  const [counts, setCounts] = useState<Record<StatutCommande | 'tous', number> | null>(null)
  const [duJour, setDuJour] = useState<Commande[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all(
      STATUTS.map((value) =>
        request<Paginated<Commande>>(`/commandes?statut=${value}&limit=1`),
      ),
    )
      .then((pages) => {
        if (!active) return
        const next = { tous: 0 } as Record<StatutCommande | 'tous', number>
        STATUTS.forEach((value, index) => {
          next[value] = pages[index].meta.total
          next.tous += pages[index].meta.total
        })
        setCounts(next)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
    request<Paginated<Commande>>('/commandes?limit=100')
      .then((data) => {
        if (active) setDuJour(data.data.filter((commande) => isToday(commande.dateCommande)))
      })
      .catch(() => {
        if (active) setDuJour([])
      })
    return () => {
      active = false
    }
  }, [request])

  useEffect(() => {
    let active = true
    const query = new URLSearchParams({ page: String(page), limit: '8' })
    if (statut) query.set('statut', statut)
    request<Paginated<Commande>>(`/commandes?${query.toString()}`)
      .then((data) => {
        if (active) setResult(data)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Chargement impossible')
      })
    return () => {
      active = false
    }
  }, [request, page, statut])

  const lignes = useMemo(() => {
    const texte = recherche.trim().toLowerCase()
    const data = result?.data ?? []
    if (!texte) return data
    return data.filter((commande) => {
      const produits = commande.lignes.map((ligne) => ligne.produit.nom).join(' ')
      return (
        reference(commande.id).toLowerCase().includes(texte) ||
        commande.client.nom.toLowerCase().includes(texte) ||
        produits.toLowerCase().includes(texte)
      )
    })
  }, [result, recherche])

  const montantJour = duJour.reduce((total, commande) => total + commande.montantTotal, 0)
  const partTerminee =
    counts && counts.tous > 0 ? Math.round((counts.TERMINEE / counts.tous) * 1000) / 10 : null

  return (
    <section className="dash">
      <div className="dash-banner">
        <p>Système de dépôt</p>
        <h1>Tableau des opérations</h1>
        <span>Suivez les commandes du jour et traitez celles qui attendent une confirmation.</span>
      </div>

      <div className="dash-kpis">
        <article>
          <span>Commandes du jour</span>
          <strong>{duJour.length}</strong>
        </article>
        <article>
          <span>En attente</span>
          <strong>{counts ? counts.EN_ATTENTE : '—'}</strong>
        </article>
        <article>
          <span>Montant du jour</span>
          <strong>{formatMoney(montantJour)}</strong>
        </article>
        <article>
          <span>Part terminée</span>
          <strong>{partTerminee === null ? '—' : `${partTerminee} %`}</strong>
        </article>
      </div>

      {error && <p className="alert">{error}</p>}

      <div className="dash-layout">
        <aside className="dash-filters">
          <p>Statut</p>
          <button
            type="button"
            className={statut === '' ? 'active' : ''}
            onClick={() => {
              setPage(1)
              setStatut('')
            }}
          >
            <span>Toutes</span>
            <em>{counts ? counts.tous : '—'}</em>
          </button>
          {STATUTS.map((value) => (
            <button
              key={value}
              type="button"
              className={statut === value ? 'active' : ''}
              onClick={() => {
                setPage(1)
                setStatut(value)
              }}
            >
              <span>{STATUT_LABEL[value]}</span>
              <em>{counts ? counts[value] : '—'}</em>
            </button>
          ))}
          <p>Action</p>
          <button type="button" onClick={() => exportCsv(lignes)} disabled={lignes.length === 0}>
            Exporter CSV
          </button>
        </aside>

        <div className="dash-table">
          <header>
            <div>
              <h2>Commandes</h2>
              <p className="muted">Les dernières commandes, avec le client et le montant.</p>
            </div>
            <input
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Référence, client ou produit…"
              aria-label="Filtrer les commandes affichées"
            />
          </header>
          {!result ? (
            <p className="muted">Chargement…</p>
          ) : lignes.length === 0 ? (
            <p className="muted">Aucune commande.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Client</th>
                    <th>Produits</th>
                    <th>Qté</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.map((commande) => (
                    <tr key={commande.id}>
                      <td>{reference(commande.id)}</td>
                      <td>{commande.client.nom}</td>
                      <td>
                        {commande.lignes.map((ligne) => ligne.produit.nom).join(', ')}
                      </td>
                      <td>{formatQuantite(quantiteTotale(commande))}</td>
                      <td>{formatMoney(commande.montantTotal)}</td>
                      <td>
                        <StatusBadge statut={commande.statut} />
                      </td>
                      <td>{formatDate(commande.dateCommande)}</td>
                      <td>
                        <Link to={`/admin/commandes/${commande.id}`}>Ouvrir</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result && recherche.trim() === '' && (
            <Pager meta={result.meta} onPage={setPage} />
          )}
        </div>
      </div>
    </section>
  )
}
