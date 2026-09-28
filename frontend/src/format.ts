export function formatMoney(value: number): string {
  const montant = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
  return `${montant} DH`
}

export function formatQuantite(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(value)
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
