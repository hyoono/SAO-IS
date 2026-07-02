/**
 * Pagination controls for Laravel paginated responses.
 */
export default function Pagination({ currentPage, lastPage, onPageChange }) {
  if (!lastPage || lastPage <= 1) return null

  const pages = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(lastPage, start + 4)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}
        className="px-3 py-1.5 text-xs font-medium text-[var(--th-text-secondary)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] disabled:opacity-30 rounded-lg cursor-pointer">Prev</button>
      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${p === currentPage ? 'bg-blue-600/80 text-[var(--th-text)]' : 'text-[var(--th-text-secondary)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)]'}`}>{p}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= lastPage}
        className="px-3 py-1.5 text-xs font-medium text-[var(--th-text-secondary)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] disabled:opacity-30 rounded-lg cursor-pointer">Next</button>
    </div>
  )
}
