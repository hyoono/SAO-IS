import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useApprovalHistory } from '../hooks/useWorkflow'
import { useDocument } from '../hooks/useDocuments'
import * as approvalsApi from '../api/approvals'

function ActionButton({ children, onClick, disabled, tone = 'emerald' }) {
  const toneClasses = tone === 'red'
    ? 'border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20'
    : tone === 'amber'
      ? 'border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
      : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${toneClasses}`}
    >
      {children}
    </button>
  )
}

export default function ApprovalDetailPage() {
  const { id } = useParams()
  const documentId = id || ''
  const { role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [remarks, setRemarks] = useState('')

  const documentQuery = useDocument(documentId)
  const historyQuery = useApprovalHistory(documentId)

  const approveMutation = useMutation({
    mutationFn: () => approvalsApi.approve(documentId, { remarks }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'queue'] })
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'history', documentId] })
      navigate('/approvals')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => approvalsApi.reject(documentId, { remarks }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'queue'] })
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'history', documentId] })
      navigate('/approvals')
    },
  })

  const requestInfoMutation = useMutation({
    mutationFn: () => approvalsApi.requestInfo(documentId, { remarks }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'queue'] })
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['approvals', 'history', documentId] })
      navigate('/approvals')
    },
  })

  const document = documentQuery.data
  const history = useMemo(() => {
    if (Array.isArray(historyQuery.data)) {
      return historyQuery.data
    }

    return []
  }, [historyQuery.data])

  if (!documentId) {
    return <Navigate to="/approvals" replace />
  }

  const canAct = ['admin', 'staff', 'faculty'].includes(role)
  const reviewable = ['pending', 'in_review'].includes(document?.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Approval Review</h1>
            <p className="text-slate-300 mt-2">Inspect a queue item and take an approval decision when allowed.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/approvals')}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to queue
            </button>
            <Link
              to={`/dashboard/${role || 'student'}`}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          {documentQuery.isLoading && <p className="text-sm text-blue-200/80">Loading approval item...</p>}
          {documentQuery.isError && <p className="text-sm text-amber-200/90">Unable to load this approval item.</p>}

          {!documentQuery.isLoading && !documentQuery.isError && document && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Title</p>
                  <p className="text-lg mt-1">{document.title || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
                  <p className="text-lg mt-1 capitalize">{document.status || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Submitter</p>
                  <p className="text-lg mt-1">{document.submitter?.name || document.submitter?.email || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Current Step</p>
                  <p className="text-lg mt-1">{document.currentStep?.name || document.current_step?.name || 'N/A'}</p>
                </div>
              </div>

              {canAct && reviewable && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 space-y-4">
                  <div>
                    <label htmlFor="remarks" className="block text-sm font-medium text-slate-300 mb-2">Remarks</label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      placeholder="Optional notes for the decision"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <ActionButton onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                      {approveMutation.isPending ? 'Approving...' : 'Approve'}
                    </ActionButton>
                    <ActionButton onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending} tone="red">
                      {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </ActionButton>
                    <ActionButton onClick={() => requestInfoMutation.mutate()} disabled={requestInfoMutation.isPending} tone="amber">
                      {requestInfoMutation.isPending ? 'Sending...' : 'Request info'}
                    </ActionButton>
                  </div>
                </div>
              )}

              {!reviewable && (
                <p className="text-sm text-slate-300">This document is not currently in a reviewable state.</p>
              )}

              <div>
                <h2 className="text-xl font-semibold">Approval History</h2>
                {historyQuery.isLoading && <p className="mt-2 text-sm text-blue-200/80">Loading history...</p>}
                {historyQuery.isError && <p className="mt-2 text-sm text-amber-200/90">Unable to load approval history.</p>}
                {!historyQuery.isLoading && !historyQuery.isError && history.length === 0 && (
                  <p className="mt-2 text-sm text-slate-300">No approval history found for this item.</p>
                )}
                {!historyQuery.isLoading && !historyQuery.isError && history.length > 0 && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {history.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-sm font-semibold capitalize">{entry.decision}</p>
                        <p className="mt-1 text-xs text-slate-400">Reviewer: {entry.reviewer?.name || 'N/A'}</p>
                        <p className="mt-1 text-xs text-slate-400">Step: {entry.step?.name || 'N/A'}</p>
                        <p className="mt-2 text-sm text-slate-300">{entry.remarks || 'No remarks provided.'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
