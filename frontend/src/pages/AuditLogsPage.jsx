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
        <h2 className="text-2xl font-semibold text-white">Audit Log</h2>
        <p className="text-sm text-slate-400 mt-1">System-wide activity trail.</p>
      </div>

      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && items.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Document</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.user?.name || '—'} <span className="text-slate-600">({log.user?.role})</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.document?.title || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination currentPage={data.current_page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  )
}
