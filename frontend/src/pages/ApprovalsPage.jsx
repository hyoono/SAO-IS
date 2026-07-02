import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApprovalQueue } from '../hooks/useWorkflow'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatDateTime } from '../utils/formatters'

export default function ApprovalsPage() {
  const queueQuery = useApprovalQueue()
  const items = useMemo(() => Array.isArray(queueQuery.data?.data) ? queueQuery.data.data : [], [queueQuery.data])

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Approvals Queue</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1">Documents awaiting your review.</p>
      </div>

      {queueQuery.isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {!queueQuery.isLoading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[var(--th-text-secondary)]">No documents pending your review.</p>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {items.map((doc) => (
              <Link key={doc.id} to={`/approvals/${doc.id}`}
                className="block rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4 hover:bg-[var(--th-surface-hover)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--th-text)] truncate">{doc.title}</p>
                    <p className="text-xs text-[var(--th-text-muted)] mt-1">{doc.submitter?.name || '—'}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-[var(--th-text-secondary)]">
                  <span>{doc.current_step?.name || doc.currentStep?.name || '—'}</span>
                  <span>{formatDateTime(doc.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block rounded-xl border border-[var(--th-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Submitter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Step</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--th-border-subtle)]">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--th-surface-hover)]">
                    <td className="px-4 py-3 text-[var(--th-text)] font-medium">{doc.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)]">{doc.submitter?.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{doc.current_step?.name || doc.currentStep?.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{formatDateTime(doc.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/approvals/${doc.id}`} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)] text-xs font-medium">Review →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
