import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api.ts'
import { useAuth } from '../auth.tsx'
import { formatMoney } from '../format.ts'
import {
  CATEGORIE_LABEL,
  CATEGORIES,
  type CategorieProduit,
  type Paginated,
  type Produit,
} from '../types.ts'

const VIDE = {
  nom: '',
  unite: 'litre',
  categorie: 'CARBURANT' as CategorieProduit,
  prixUnitaire: '',
  disponible: true,
}

function jour(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}

export function AdminProduits() {
  const { request } = useAuth()
  const [result, setResult] = useState<Paginated<Produit> | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(VIDE)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<CategorieProduit | ''>('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(
    () => request<Paginated<Produit>>('/produits?page=1&limit=100').then(setResult),
    [request],
  )

  useEffect(() => {
    reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    })
  }, [reload])

  function openCreate() {
    setEditingId(null)
    setForm(VIDE)
    setFormOpen(true)
  }

  function edit(produit: Produit) {
    setMenuId(null)
    setEditingId(produit.id)
    setForm({
      nom: produit.nom,
      unite: produit.unite,
      categorie: produit.categorie,
      prixUnitaire: String(produit.prixUnitaire),
      disponible: produit.disponible,
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(VIDE)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const body = {
      nom: form.nom,
      unite: form.unite,
      categorie: form.categorie,
      prixUnitaire: Number(form.prixUnitaire),
      disponible: form.disponible,
    }
    try {
      await request(editingId ? `/produits/${editingId}` : '/produits', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      closeForm()
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement refusé')
    }
  }

  async function toggle(produit: Produit) {
    setError('')
    setBusyId(produit.id)
    try {
      await request(`/produits/${produit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ disponible: !produit.disponible }),
      })
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Modification refusée')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(produit: Produit) {
    setMenuId(null)
    if (!window.confirm(`Retirer « ${produit.nom} » ? S’il a déjà été commandé, il sera seulement désactivé.`)) {
      return
    }
    setError('')
    try {
      await request(`/produits/${produit.id}`, { method: 'DELETE' })
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression refusée')
    }
  }

  const produits = result?.data ?? []
  const total = result?.meta.total ?? 0
  const actifs = produits.filter((produit) => produit.disponible).length
  const inactifs = produits.length - actifs
  const terme = search.trim().toLowerCase()
  const visibles = produits.filter(
    (produit) =>
      (filtre === '' || produit.categorie === filtre) &&
      (terme === '' ||
        produit.nom.toLowerCase().includes(terme) ||
        produit.unite.toLowerCase().includes(terme)),
  )

  return (
    <section className="products-page">
      <header className="products-head">
        <div>
          <h1>Gestion des produits</h1>
          <p className="muted">Catalogue du dépôt, prix unitaires et disponibilité à la commande.</p>
        </div>
        <button type="button" className="btn" onClick={openCreate}>
          + Ajouter un produit
        </button>
      </header>

      <div className="products-kpis">
        <article>
          <span>Produits au catalogue</span>
          <strong>{total}</strong>
          <i aria-hidden="true">▣</i>
        </article>
        <article>
          <span>Disponibles</span>
          <strong>{actifs}</strong>
          <i className="ok" aria-hidden="true">✓</i>
        </article>
        <article>
          <span>Indisponibles</span>
          <strong>{inactifs}</strong>
          <i className="off" aria-hidden="true">!</i>
        </article>
      </div>

      {error && <p className="alert">{error}</p>}

      {formOpen && (
        <form className="products-form" onSubmit={(event) => void onSubmit(event)}>
          <h2>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <div className="form-grid">
            <label>
              Nom
              <input
                value={form.nom}
                onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                required
              />
            </label>
            <label>
              Unité
              <input
                value={form.unite}
                onChange={(event) => setForm((current) => ({ ...current, unite: event.target.value }))}
                required
              />
            </label>
            <label>
              Catégorie
              <select
                value={form.categorie}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categorie: event.target.value as CategorieProduit,
                  }))
                }
              >
                {CATEGORIES.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {CATEGORIE_LABEL[categorie]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prix unitaire (DH)
              <input
                type="number"
                min="0.0001"
                step="0.0001"
                value={form.prixUnitaire}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prixUnitaire: event.target.value }))
                }
                required
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(event) =>
                  setForm((current) => ({ ...current, disponible: event.target.checked }))
                }
              />
              Disponible
            </label>
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              {editingId ? 'Enregistrer' : 'Créer'}
            </button>
            <button className="btn line" type="button" onClick={closeForm}>
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="products-table">
        <div className="products-toolbar">
          <input
            type="search"
            placeholder="Rechercher par nom ou unité…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={filtre}
            onChange={(event) => setFiltre(event.target.value as CategorieProduit | '')}
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((categorie) => (
              <option key={categorie} value={categorie}>
                {CATEGORIE_LABEL[categorie]}
              </option>
            ))}
          </select>
          <span className="muted">
            {visibles.length} sur {total} produit{total > 1 ? 's' : ''}
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
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Unité</th>
                  <th className="num">Prix unitaire (DH)</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((produit) => (
                  <tr key={produit.id} className={produit.disponible ? '' : 'is-off'}>
                    <td>
                      <span className="product-mark">
                        {produit.nom.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    </td>
                    <td>
                      <strong>{produit.nom}</strong>
                      <em>Modifié le {jour(produit.updatedAt)}</em>
                    </td>
                    <td>
                      <span className={`cat-chip cat-${produit.categorie}`}>
                        {CATEGORIE_LABEL[produit.categorie]}
                      </span>
                    </td>
                    <td>
                      <span className="unit-chip">{produit.unite}</span>
                    </td>
                    <td className="num">{formatMoney(produit.prixUnitaire)}</td>
                    <td>
                      <div className="status-cell">
                        <span className={produit.disponible ? 'state on' : 'state'}>
                          {produit.disponible ? 'Disponible' : 'Indisponible'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={produit.disponible}
                          aria-label={`Disponibilité de ${produit.nom}`}
                          className={produit.disponible ? 'switch on' : 'switch'}
                          disabled={busyId === produit.id}
                          onClick={() => void toggle(produit)}
                        >
                          <span />
                        </button>
                      </div>
                    </td>
                    <td className="row-menu">
                      <button
                        type="button"
                        aria-label={`Actions pour ${produit.nom}`}
                        onClick={() => setMenuId(menuId === produit.id ? null : produit.id)}
                      >
                        ⋯
                      </button>
                      {menuId === produit.id && (
                        <div className="row-menu-list">
                          <button type="button" onClick={() => edit(produit)}>
                            Modifier
                          </button>
                          <button type="button" className="danger" onClick={() => void remove(produit)}>
                            Retirer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      Aucun produit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > produits.length && (
          <p className="muted">Seuls les 100 premiers produits (par nom) sont affichés.</p>
        )}
      </div>
    </section>
  )
}
