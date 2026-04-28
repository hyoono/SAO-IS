import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocument } from '../hooks/useDocuments'
import * as approvalsApi from '../api/approvals'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatDateTime } from '../utils/formatters'

export default function ApprovalDetailPage() {
  const { id } = useParams()
  const { role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const documentQuery = useDocument(id)
  const historyQuery = useQuery({
    queryKey: ['document', id, 'history'],
    queryFn: () => approvalsApi.getApprovalHistory(id).then(r => r.data),
    enabled: !!id,
  })

  const history = useMemo(() => Array.isArray(historyQuery.data) ? historyQuery.data : [], [historyQuery.data])
  const doc = documentQuery.data

  const doAction = (action) => {
    const fn = action === 'approve' ? approvalsApi.approve
      : action === 'reject' ? approvalsApi.reject
      : approvalsApi.requestInfo
    return fn(id, { remarks })
  }

  const actionMutation = useMutation({
    mutationFn: doAction,
    onSuccess: (res) => {
      setActionMsg(res.data.message)
      setRemarks('')
      queryClient.invalidateQueries({ queryKey: ['document', id] })
      queryClient.invalidateQueries({ queryKey: ['document', id, 'history'] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: (err) => setActionMsg(err?.response?.data?.message || 'Action failed.'),
  })

  const canReview = doc && ['pending', 'in_review'].includes(doc.status) && ['admin', 'staff', 'faculty'].includes(role)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {documentQuery.isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {doc && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">{doc.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={doc.status} />
                <span className="text-xs text-slate-500">{doc.document_type?.name || doc.documentType?.name}</span>
              </div>
            </div>
            <Link to="/approvals" className="text-sm text-slate-400 hover:text-white">← Queue</Link>
          </div>

          {/* Review actions */}
          {canReview && (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Review Actions</h3>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Optional remarks…"
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="flex gap-3">
                <button onClick={() => actionMutation.mutate('approve')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg cursor-pointer">Approve</button>
                <button onClick={() => actionMutation.mutate('reject')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-red-200 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-lg cursor-pointer">Reject</button>
                <button onClick={() => actionMutation.mutate('request-info')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg cursor-pointer">Request Info</button>
              </div>
              {actionMsg && <p className="text-xs text-emerald-300">{actionMsg}</p>}
            </div>
          )}

          {/* Approval History */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Approval History</h3>
            {history.length === 0 && <p className="text-sm text-slate-400">No approval history yet.</p>}
            {history.length > 0 && (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={h.id || i} className="rounded-lg border border-white/5 bg-slate-950/40 p-4 flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${h.decision === 'approved' ? 'bg-emerald-400' : h.decision === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm text-white font-medium capitalize">{h.decision?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">{h.reviewer?.name} · Step {h.step?.step_order}: {h.step?.name}</p>
                      {h.remarks && <p className="text-xs text-slate-500 mt-1 italic">"{h.remarks}"</p>}
                      <p className="text-[10px] text-slate-600 mt-1">{formatDateTime(h.reviewed_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
