import type { PageMeta } from '../types.ts'

export function Pager({
  meta,
  onPage,
}: {
  meta: PageMeta
  onPage: (page: number) => void
}) {
  if (meta.totalPages <= 1) return null
  return (
    <div className="pager">
      <button
        type="button"
        className="btn ghost"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        Précédent
      </button>
      <span>
        {meta.page} / {meta.totalPages}
      </span>
      <button
        type="button"
        className="btn ghost"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPage(meta.page + 1)}
      >
        Suivant
      </button>
    </div>
  )
}
