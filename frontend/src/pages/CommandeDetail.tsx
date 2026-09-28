import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { formatDate, formatMoney } from '../format.ts'
import {
  STATUT_LABEL,
  TRANSITIONS,
  isStaffProfil,
  type ClientProfil,
  type Commande,
  type StatutCommande,
} from '../types.ts'

function reference(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function quantite(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)
}

function actionLabel(statut: StatutCommande): string {
  if (statut === 'ANNULEE') return 'Annuler'
  if (statut === 'CONFIRMEE') return 'Confirmer'
  if (statut === 'TERMINEE') return 'Terminer'
  return STATUT_LABEL[statut]
}

function exporterRecu(commande: Commande, clientNom: string) {
  const lines = [
    `Commande;${reference(commande.id)}`,
    `Client;${clientNom}`,
    `Statut;${STATUT_LABEL[commande.statut]}`,
    `Date;${formatDate(commande.dateCommande)}`,
    '',
    'produit;quantite;unite;prix (DH);sous-total (DH)',
    ...commande.lignes.map((ligne) =>
      [
        ligne.produit.nom,
        String(ligne.quantite),
        ligne.produit.unite,
        String(ligne.prixUnitaireApplique),
        String(ligne.quantite * ligne.prixUnitaireApplique),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(';'),
    ),
    '',
    `Total (DH);${commande.montantTotal}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recu-${reference(commande.id)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exporterCsv(commande: Commande) {
  const lines = [
    'produit;quantite;unite;prix (DH);sous-total (DH)',
    ...commande.lignes.map((ligne) =>
      [
        ligne.produit.nom,
        String(ligne.quantite),
        ligne.produit.unite,
        String(ligne.prixUnitaireApplique),
        String(ligne.quantite * ligne.prixUnitaireApplique),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(';'),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `commande-${reference(commande.id)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function CommandeDetail() {
  const { id } = useParams()
  const { request, session } = useAuth()
  const [commande, setCommande] = useState<Commande | null>(null)
  const [client, setClient] = useState<ClientProfil | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const staff = session?.type === 'STAFF'

  useEffect(() => {
    if (!id) return
    let active = true
    request<Commande>(`/commandes/${id}`)
      .then((data) => {
        if (active) setCommande(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Commande introuvable')
        }
      })
    return () => {
      active = false
    }
  }, [request, id])

  useEffect(() => {
    if (!staff || !commande) return
    let active = true
    request<ClientProfil>(`/clients/${commande.clientId}`)
      .then((data) => {
        if (active) setClient(data)
      })
      .catch(() => {
        if (active) setClient(null)
      })
    return () => {
      active = false
    }
  }, [request, staff, commande])

  async function changerStatut(statut: StatutCommande) {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const updated = await request<Commande>(`/commandes/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      })
      setCommande(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Changement refusé')
    } finally {
      setBusy(false)
    }
  }

  if (!commande) {
    return (
      <section>
        {error ? <p className="alert">{error}</p> : <p className="muted">Chargement…</p>}
      </section>
    )
  }

  const suite = TRANSITIONS[commande.statut]
  const sessionClient =
    session?.type === 'CLIENT' && !isStaffProfil(session.profil) ? session.profil : null
  const email = client?.email ?? sessionClient?.email ?? null
  const adresse = client?.adresse ?? sessionClient?.adresse ?? null
  const telephone = client?.telephone ?? commande.client.telephone
  const nom = client?.nom ?? commande.client.nom
  const sousTotal = commande.lignes.reduce(
    (total, ligne) => total + ligne.quantite * ligne.prixUnitaireApplique,
    0,
  )
  const initiale = nom.trim().charAt(0).toUpperCase() || '?'
  const terminee = commande.statut === 'TERMINEE'
  const annulee = commande.statut === 'ANNULEE'

  return (
    <section className="order-detail">
      <Link className="back-link" to={staff ? '/admin/commandes' : '/commandes'}>
        Retour aux commandes
      </Link>
      <header className="order-head">
        <div>
          <div className="order-title">
            <h1>{reference(commande.id)}</h1>
            <StatusBadge statut={commande.statut} />
          </div>
          <p className="muted">
            {annulee
              ? `Passée le ${formatDate(commande.dateCommande)} · Annulée le ${formatDate(commande.updatedAt)}`
              : terminee
                ? `Terminée le ${formatDate(commande.updatedAt)}`
                : `Reçue le ${formatDate(commande.dateCommande)}`}
          </p>
        </div>
        {staff && (
          <div className="actions">
            {(commande.statut === 'CONFIRMEE' || terminee) && (
              <button
                type="button"
                className="btn line"
                onClick={() => exporterRecu(commande, nom)}
              >
                Télécharger le reçu
              </button>
            )}
            {(terminee || annulee) && (
              <button type="button" className="btn line" onClick={() => exporterCsv(commande)}>
                Exporter CSV
              </button>
            )}
            {annulee && email && (
              <a className="btn" href={`mailto:${email}`}>
                Contacter le client
              </a>
            )}
            {suite.includes('ANNULEE') && (
              <button
                type="button"
                className="btn danger"
                disabled={busy}
                onClick={() => changerStatut('ANNULEE')}
              >
                Annuler
              </button>
            )}
            {suite
              .filter((statut) => statut !== 'ANNULEE')
              .map((statut) => (
                <button
                  key={statut}
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => changerStatut(statut)}
                >
                  {actionLabel(statut)}
                </button>
              ))}
          </div>
        )}
      </header>
      {error && <p className="alert">{error}</p>}

      {annulee && (
        <article className="cancel-banner">
          <h2>Commande annulée</h2>
          <p>Cette commande ne sera pas exécutée. Aucun montant n’est facturé.</p>
        </article>
      )}

      <div className="order-grid">
        <div className="order-main">
          {terminee && (
            <article className="order-card logistics">
              <h2>Clôture</h2>
              <p className="muted">Dates de la commande et mode de règlement.</p>
              <dl>
                <div>
                  <dt>Date de commande</dt>
                  <dd>{formatDate(commande.dateCommande)}</dd>
                </div>
                <div>
                  <dt>Date de clôture</dt>
                  <dd>{formatDate(commande.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Règlement</dt>
                  <dd>Facturation sur compte client</dd>
                </div>
              </dl>
            </article>
          )}
          <article className="order-card">
            <header>
              <h2>Lignes</h2>
              <span className="muted">
                {commande.lignes.length} produit{commande.lignes.length > 1 ? 's' : ''}
              </span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                    <th>Sous-total</th>
                  </tr>
                </thead>
                <tbody>
                  {commande.lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td>{ligne.produit.nom}</td>
                      <td>
                        {quantite(ligne.quantite)} {ligne.produit.unite}
                      </td>
                      <td>{formatMoney(ligne.prixUnitaireApplique)}</td>
                      <td>{formatMoney(ligne.quantite * ligne.prixUnitaireApplique)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!annulee && (
              <div className="order-total">
                <p>
                  <span>Sous-total</span>
                  <strong>{formatMoney(sousTotal)}</strong>
                </p>
                <p className="grand">
                  <span>Total</span>
                  <strong>{formatMoney(commande.montantTotal)}</strong>
                </p>
              </div>
            )}
          </article>

          {!terminee && (
          <article className="order-card">
            <h2>Suivi</h2>
            <ol className="audit">
              {annulee && (
                <li className="void">
                  <strong>Annulée</strong>
                  <span>{formatDate(commande.updatedAt)}</span>
                  <em>La commande ne sera pas exécutée.</em>
                </li>
              )}
              {commande.statut === 'CONFIRMEE' && (
                <li>
                  <strong>Confirmée</strong>
                  {commande.statut === 'CONFIRMEE' && <span>{formatDate(commande.updatedAt)}</span>}
                  <em>Confirmée par le dépôt.</em>
                </li>
              )}
              <li>
                <strong>Commande passée</strong>
                <span>{formatDate(commande.dateCommande)}</span>
                <em>Enregistrée par {nom}.</em>
              </li>
            </ol>
          </article>
          )}
        </div>

        <aside className="order-side">
          <article className="order-card client-card">
            <h2>Client</h2>
            <div className="client-id">
              <span>{initiale}</span>
              <div>
                <strong>{nom}</strong>
                <p className="muted">Compte client</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Téléphone</dt>
                <dd>{telephone}</dd>
              </div>
              {email && (
                <div>
                  <dt>Email</dt>
                  <dd>{email}</dd>
                </div>
              )}
              {adresse && (
                <div>
                  <dt>Adresse</dt>
                  <dd>{adresse}</dd>
                </div>
              )}
            </dl>
            {staff && (
              <Link className="btn ghost" to={`/admin/clients/${commande.clientId}`}>
                Voir la fiche
              </Link>
            )}
          </article>
          {terminee ? (
            <article className="order-card">
              <h2>Suivi</h2>
              <ol className="audit">
                <li>
                  <strong>Terminée</strong>
                  <span>{formatDate(commande.updatedAt)}</span>
                  <em>La commande est close.</em>
                </li>
                <li>
                  <strong>Confirmée</strong>
                  <em>Confirmée par le dépôt.</em>
                </li>
                <li>
                  <strong>Commande passée</strong>
                  <span>{formatDate(commande.dateCommande)}</span>
                  <em>Enregistrée par {nom}.</em>
                </li>
              </ol>
            </article>
          ) : annulee ? (
            <article className="order-card void-summary">
              <h2>Récapitulatif</h2>
              <p className="muted">Montant enregistré, non facturé.</p>
              <p>
                <span>Sous-total</span>
                <strong>{formatMoney(sousTotal)}</strong>
              </p>
              <p className="grand">
                <span>Total</span>
                <strong>{formatMoney(commande.montantTotal)}</strong>
              </p>
              <p className="void-note">Commande annulée. Rien n’est facturé.</p>
            </article>
          ) : (
            <article className="order-card note-card">
              <h2>{commande.statut === 'CONFIRMEE' ? 'Préparation' : 'Règlement'}</h2>
              <p>
                {commande.statut === 'CONFIRMEE'
                  ? 'La commande est confirmée. Le dépôt prépare les produits. Aucun paiement n’est encaissé ici.'
                  : 'Aucun paiement n’est encaissé ici. La facture est émise par le dépôt.'}
              </p>
            </article>
          )}
        </aside>
      </div>
    </section>
  )
}
