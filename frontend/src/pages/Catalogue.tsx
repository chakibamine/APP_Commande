import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { formatMoney } from '../format.ts'
import { CATEGORIE_LABEL, type Paginated, type Produit } from '../types.ts'

export function Catalogue() {
  const { request } = useAuth()
  const navigate = useNavigate()
  const [produits, setProduits] = useState<Produit[]>([])
  const [quantites, setQuantites] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    request<Paginated<Produit>>('/produits?limit=100')
      .then((page) => {
        if (active) setProduits(page.data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : 'Catalogue indisponible')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [request])

  const estimation = produits.reduce((total, produit) => {
    const quantite = Number(quantites[produit.id] ?? 0)
    if (!Number.isFinite(quantite) || quantite <= 0) return total
    return total + quantite * produit.prixUnitaire
  }, 0)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const lignes = produits
      .map((produit) => ({
        produitId: produit.id,
        quantite: Number(quantites[produit.id] ?? 0),
      }))
      .filter((ligne) => ligne.quantite > 0)
    if (lignes.length === 0) {
      setError('Indiquez une quantité pour au moins un produit.')
      return
    }
    setSending(true)
    try {
      const commande = await request<{ id: string }>('/commandes', {
        method: 'POST',
        body: JSON.stringify({ lignes }),
      })
      navigate(`/commandes/${commande.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Commande refusée')
    } finally {
      setSending(false)
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1>Commander</h1>
        </div>
        <p className="lead">
          Le montant est calculé par le serveur au prix en vigueur.
        </p>
      </header>
      {error && <p className="alert">{error}</p>}
      {loading ? (
        <p className="muted">Chargement du catalogue…</p>
      ) : produits.length === 0 ? (
        <p className="muted">Aucun produit disponible.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="product-grid">
            {produits.map((produit) => (
              <article className="product-card" key={produit.id}>
                <div>
                  <span className="cat-chip">{CATEGORIE_LABEL[produit.categorie]}</span>
                  <h2>{produit.nom}</h2>
                  <p className="price">
                    {formatMoney(produit.prixUnitaire)}
                    <span> / {produit.unite}</span>
                  </p>
                </div>
                <label>
                  Quantité ({produit.unite})
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    inputMode="decimal"
                    value={quantites[produit.id] ?? ''}
                    onChange={(event) =>
                      setQuantites((current) => ({
                        ...current,
                        [produit.id]: event.target.value,
                      }))
                    }
                  />
                </label>
              </article>
            ))}
          </div>
          <div className="order-bar">
            <div>
              <span className="muted">Estimation</span>
              <strong>{formatMoney(estimation)}</strong>
            </div>
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Envoi…' : 'Passer la commande'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
