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
        <h2 className="text-2xl font-semibold text-white">Approvals Queue</h2>
        <p className="text-sm text-slate-400 mt-1">Documents awaiting your review.</p>
      </div>

      {queueQuery.isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!queueQuery.isLoading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-slate-400">No documents pending your review.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Submitter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Step</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{doc.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{doc.submitter?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{doc.current_step?.name || doc.currentStep?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(doc.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/approvals/${doc.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Review →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
