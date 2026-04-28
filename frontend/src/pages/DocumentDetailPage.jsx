import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocument, useDocumentVersions } from '../hooks/useDocuments'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import * as documentsApi from '../api/documents'
import { formatDateTime, formatFileSize } from '../utils/formatters'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const documentId = id || ''
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const [uploadMsg, setUploadMsg] = useState('')

  const documentQuery = useDocument(documentId)
  const versionsQuery = useDocumentVersions(documentId)

  const archiveMutation = useMutation({
    mutationFn: () => documentsApi.archiveDocument(documentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['document', documentId] }); queryClient.invalidateQueries({ queryKey: ['documents'] }) },
  })

  const uploadVersionMutation = useMutation({
    mutationFn: (formData) => documentsApi.uploadVersion(documentId, formData),
    onSuccess: () => { setUploadMsg('Version uploaded!'); queryClient.invalidateQueries({ queryKey: ['document', documentId, 'versions'] }) },
    onError: () => setUploadMsg('Upload failed.'),
  })

  const doc = documentQuery.data
  const versions = useMemo(() => Array.isArray(versionsQuery.data) ? versionsQuery.data : [], [versionsQuery.data])

  if (!documentId) return <Navigate to="/documents" replace />

  const canArchive = ['admin', 'staff'].includes(role)
  const canUpload = doc && (['admin', 'staff'].includes(role) || doc.submitted_by === doc.submitter?.id)

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    uploadVersionMutation.mutate(fd)
    e.target.value = ''
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {documentQuery.isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading document…</p>}
      {documentQuery.isError && <p className="text-sm text-red-300 py-8 text-center">Failed to load document.</p>}

      {doc && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{doc.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={doc.status} />
                <span className="text-xs text-slate-500">{doc.document_type?.name || doc.documentType?.name}</span>
              </div>
            </div>
            <Link to="/documents" className="text-sm text-slate-400 hover:text-white">← Back</Link>
          </div>

          {/* Metadata grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Submitter', value: doc.submitter?.name || doc.submitter?.email },
              { label: 'Current Step', value: doc.currentStep?.name || doc.current_step?.name || 'Completed' },
              { label: 'Created', value: formatDateTime(doc.created_at) },
              { label: 'Expires', value: doc.expires_at ? formatDateTime(doc.expires_at) : 'Never' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-slate-950/50 border border-white/5 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white mt-1">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {canArchive && doc.status !== 'archived' && (
              <button onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg cursor-pointer disabled:opacity-50">
                {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
              </button>
            )}
            {canUpload && (
              <label className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg cursor-pointer">
                Upload new version
                <input type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
              </label>
            )}
            {uploadMsg && <span className="text-xs text-emerald-300">{uploadMsg}</span>}
          </div>

          {/* Versions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Version History</h3>
            {versionsQuery.isLoading && <p className="text-sm text-blue-200/80">Loading…</p>}
            {versions.length === 0 && !versionsQuery.isLoading && <p className="text-sm text-slate-400">No versions.</p>}
            {versions.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950/60 border-b border-white/5">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Version</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Filename</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Size</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase">Uploaded</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {versions.map((v) => (
                      <tr key={v.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-white font-medium">v{v.version_number}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{v.original_filename}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{formatFileSize(v.file_size_bytes)}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{formatDateTime(v.created_at)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <a href={`/api/v1/documents/${documentId}/versions/${v.id}/download`}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Download</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
