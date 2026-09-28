export type TokenType = 'CLIENT' | 'STAFF'

export type StatutCommande =
  | 'EN_ATTENTE'
  | 'CONFIRMEE'
  | 'TERMINEE'
  | 'ANNULEE'

export type Role = 'ADMIN' | 'GESTIONNAIRE'

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ClientProfil {
  id: string
  nom: string
  telephone: string
  email: string | null
  adresse: string
  createdAt: string
  updatedAt: string
}

export interface StaffProfil {
  id: string
  nom: string
  email: string
  role: Role
  createdAt: string
}

export interface Session {
  accessToken: string
  type: TokenType
  profil: ClientProfil | StaffProfil
}

export type CategorieProduit = 'CARBURANT' | 'LUBRIFIANT' | 'GAZ' | 'AUTRE'

export const CATEGORIE_LABEL: Record<CategorieProduit, string> = {
  CARBURANT: 'Carburant',
  LUBRIFIANT: 'Lubrifiant',
  GAZ: 'Gaz',
  AUTRE: 'Autre',
}

export const CATEGORIES = Object.keys(CATEGORIE_LABEL) as CategorieProduit[]

export interface Produit {
  id: string
  nom: string
  unite: string
  categorie: CategorieProduit
  prixUnitaire: number
  disponible: boolean
  createdAt: string
  updatedAt: string
}

export interface LigneCommande {
  id: string
  produitId: string
  quantite: number
  prixUnitaireApplique: number
  produit: { id: string; nom: string; unite: string }
}

export interface Commande {
  id: string
  clientId: string
  statut: StatutCommande
  montantTotal: number
  dateCommande: string
  updatedAt: string
  client: { id: string; nom: string; telephone: string }
  lignes: LigneCommande[]
}

export const STATUT_LABEL: Record<StatutCommande, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

export const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  EN_ATTENTE: ['CONFIRMEE', 'ANNULEE'],
  CONFIRMEE: ['TERMINEE', 'ANNULEE'],
  TERMINEE: [],
  ANNULEE: [],
}

export function isStaffProfil(
  profil: ClientProfil | StaffProfil,
): profil is StaffProfil {
  return 'role' in profil
}
