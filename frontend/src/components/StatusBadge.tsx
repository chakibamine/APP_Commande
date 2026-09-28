import { STATUT_LABEL, type StatutCommande } from '../types.ts'

export function StatusBadge({ statut }: { statut: StatutCommande }) {
  return <span className={`badge badge-${statut}`}>{STATUT_LABEL[statut]}</span>
}
