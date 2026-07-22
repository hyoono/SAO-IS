import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocument } from '../hooks/useDocuments'
import * as approvalsApi from '../api/approvals'
import * as documentsApi from '../api/documents'
import * as aiApi from '../api/ai'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import { formatDateTime, formatFileSize } from '../utils/formatters'

function canReviewCurrentStep(user, doc) {
  const step = doc?.current_step || doc?.currentStep
  if (!user || !doc || !step || !['pending', 'in_review'].includes(doc.status)) return false
  if (step.assignee_user_id === user.id) return true
  if (step.assignee_role !== user.role) return false
  if (!step.center_id) return true
  return !!user.center_id && step.center_id === user.center_id
}

export default function ApprovalDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const documentQuery = useDocument(id)
  const historyQuery = useQuery({
    queryKey: ['document', id, 'history'],
    queryFn: () => approvalsApi.getApprovalHistory(id).then(r => r.data),
    enabled: !!id,
  })
  const versionsQuery = useQuery({
    queryKey: ['document', id, 'versions'],
    queryFn: () => documentsApi.getVersions(id).then(r => r.data),
    enabled: !!id,
  })

  const history = useMemo(() => Array.isArray(historyQuery.data) ? historyQuery.data : [], [historyQuery.data])
  const versions = useMemo(() => Array.isArray(versionsQuery.data) ? versionsQuery.data : [], [versionsQuery.data])
  const doc = documentQuery.data
  const latestVersion = versions[0]

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
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err) => setActionMsg(err?.response?.data?.message || 'Action failed.'),
  })

  const canReview = canReviewCurrentStep(user, doc)

  const recommendationQuery = useQuery({
    queryKey: ['document', id, 'ai-recommendation', doc?.current_step?.name || doc?.currentStep?.name],
    queryFn: () => aiApi.recommendApproval({ document_id: id, step_name: doc.current_step?.name || doc.currentStep?.name }).then(r => r.data),
    enabled: !!id && !!doc && canReview,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {documentQuery.isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {doc && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--th-text)]">{doc.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={doc.status} />
                <span className="text-xs text-[var(--th-text-muted)]">{doc.document_type?.name || doc.documentType?.name}</span>
              </div>
            </div>
            <Link to="/approvals" className="text-sm text-[var(--th-text-secondary)] hover:text-[var(--th-text)]">← Queue</Link>
          </div>

          {/* Document Info Panel */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4">
              <p className="text-[10px] text-[var(--th-text-muted)] uppercase tracking-wider">Submitter</p>
              <p className="text-sm text-[var(--th-text)] mt-1">{doc.submitter?.name || doc.user?.name || '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4">
              <p className="text-[10px] text-[var(--th-text-muted)] uppercase tracking-wider">Current Step</p>
              <p className="text-sm text-[var(--th-text)] mt-1">{doc.current_step?.name || doc.currentStep?.name || '—'}</p>
            </div>
            <div className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4">
              <p className="text-[10px] text-[var(--th-text-muted)] uppercase tracking-wider">Submitted</p>
              <p className="text-sm text-[var(--th-text)] mt-1">{formatDateTime(doc.created_at)}</p>
            </div>
            <div className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4">
              <p className="text-[10px] text-[var(--th-text-muted)] uppercase tracking-wider">Expires</p>
              <p className="text-sm text-[var(--th-text)] mt-1">{doc.expires_at ? formatDateTime(doc.expires_at) : 'Never'}</p>
            </div>
          </div>

          {/* File Preview / Download */}
          {versions.length > 0 && (
            <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--th-text)] mb-3">Attached Document</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--th-text)]">{latestVersion.original_filename}</p>
                    <p className="text-xs text-[var(--th-text-muted)]">
                      Version {latestVersion.version_number} · {formatFileSize(latestVersion.file_size_bytes)} · {formatDateTime(latestVersion.created_at)}
                    </p>
                  </div>
                </div>
                <a href={`/api/v1/documents/${id}/versions/${latestVersion.id}/download`}
                  className="px-4 py-2 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg"
                  target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </div>
              {versions.length > 1 && (
                <p className="text-[10px] text-[var(--th-text-muted)] mt-3">{versions.length} versions available · <Link to={`/documents/${id}`} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)]">View all →</Link></p>
              )}
            </div>
          )}

          {/* Review actions */}
          {canReview && (
            <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--th-text)]">Review Actions</h3>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="Optional remarks…"
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="flex gap-3">
                <button onClick={() => actionMutation.mutate('approve')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-[var(--th-btn-success-text)] bg-[var(--th-btn-success-bg)] border border-[var(--th-btn-success-border)] hover:bg-[var(--th-btn-success-hover)] rounded-lg cursor-pointer">Approve</button>
                <button onClick={() => actionMutation.mutate('reject')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-[var(--th-btn-danger-text)] bg-[var(--th-btn-danger-bg)] border border-[var(--th-btn-danger-border)] hover:bg-[var(--th-btn-danger-hover)] rounded-lg cursor-pointer">Reject</button>
                <button onClick={() => actionMutation.mutate('request-info')} disabled={actionMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-[var(--th-btn-warning-text)] bg-[var(--th-btn-warning-bg)] border border-[var(--th-btn-warning-border)] hover:bg-[var(--th-btn-warning-hover)] rounded-lg cursor-pointer">Request Info</button>
              </div>
              {actionMsg && <p className="text-xs text-[var(--th-btn-success-text)]">{actionMsg}</p>}
              
              {/* AI Recommendation Box */}
              {recommendationQuery.isLoading && <p className="text-xs text-blue-400 mt-2">✨ AI is reviewing the document...</p>}
              {recommendationQuery.data && (
                <div className={`mt-4 p-3 rounded-lg border ${recommendationQuery.data.recommendation === 'Approve' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <p className="text-xs font-semibold text-[var(--th-text)] flex items-center gap-1">
                    ✨ AI Suggestion: <span className={recommendationQuery.data.recommendation === 'Approve' ? 'text-emerald-500' : 'text-red-500'}>{recommendationQuery.data.recommendation}</span>
                  </p>
                  <p className="text-xs text-[var(--th-text-secondary)] mt-1">{recommendationQuery.data.reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* Approval History */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--th-text)] mb-3">Approval History</h3>
            {history.length === 0 && <p className="text-sm text-[var(--th-text-secondary)]">No approval history yet.</p>}
            {history.length > 0 && (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={h.id || i} className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4 flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${h.decision === 'approved' ? 'bg-emerald-400' : h.decision === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm text-[var(--th-text)] font-medium capitalize">{h.decision?.replace('_', ' ')}</p>
                      <p className="text-xs text-[var(--th-text-secondary)]">{h.reviewer?.name} · Step {h.step?.step_order}: {h.step?.name}</p>
                      {h.remarks && <p className="text-xs text-[var(--th-text-muted)] mt-1 italic">"{h.remarks}"</p>}
                      <p className="text-[10px] text-[var(--th-text-faint)] mt-1">{formatDateTime(h.reviewed_at)}</p>
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
