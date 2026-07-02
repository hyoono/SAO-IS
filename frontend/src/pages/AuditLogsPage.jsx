import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { formatDateTime } from '../utils/formatters'
import Pagination from '../components/ui/Pagination.jsx'
import { useState } from 'react'

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => api.get('/audit-logs', { params: { page } }).then(r => r.data),
  })

  const items = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Audit Log</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1">System-wide activity trail.</p>
      </div>

      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {!isLoading && items.length > 0 && (
        <>
          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {items.map((log) => (
              <div key={log.id} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4">
                <p className="text-xs font-mono text-[var(--th-text)] font-medium">{log.action}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--th-text-secondary)]">
                  <span>{log.user?.name || '—'} <span className="text-[var(--th-text-faint)]">({log.user?.role})</span></span>
                  <span className="text-[var(--th-text-muted)]">{formatDateTime(log.created_at)}</span>
                </div>
                {log.document?.title && (
                  <p className="text-xs text-[var(--th-text-muted)] mt-1 truncate">📄 {log.document.title}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block rounded-xl border border-[var(--th-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--th-border-subtle)]">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--th-surface-hover)]">
                    <td className="px-4 py-3 text-[var(--th-text)] font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{log.user?.name || '—'} <span className="text-[var(--th-text-faint)]">({log.user?.role})</span></td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{log.document?.title || '—'}</td>
                    <td className="px-4 py-3 text-[var(--th-text-muted)] text-xs">{formatDateTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data && <Pagination currentPage={data.current_page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  )
}
