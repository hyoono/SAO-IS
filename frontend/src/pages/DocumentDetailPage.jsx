import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocument, useDocumentVersions } from '../hooks/useDocuments'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import LocalAiExtractor from '../components/ai/LocalAiExtractor'
import BilingualAssistant from '../components/ai/BilingualAssistant'
import * as documentsApi from '../api/documents'
import * as aiApi from '../api/ai'
import { formatDateTime, formatFileSize } from '../utils/formatters'

const AI_SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

function isAiSupportedVersion(version) {
  const mime = (version.mime_type || '').toLowerCase()
  const filename = (version.original_filename || '').toLowerCase()
  return AI_SUPPORTED_MIME_TYPES.includes(mime)
    || filename.endsWith('.pdf')
    || filename.endsWith('.docx')
    || filename.endsWith('.xlsx')
    || filename.endsWith('.png')
    || filename.endsWith('.jpg')
    || filename.endsWith('.jpeg')
}

export default function DocumentDetailPage() {
  const { id } = useParams()
  const documentId = id || ''
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const [uploadMsg, setUploadMsg] = useState('')
  const [extractorState, setExtractorState] = useState({ isOpen: false, versionId: null, filename: '' })
  const [verifyMsg, setVerifyMsg] = useState(null)
  
  const verifyMutation = useMutation({
    mutationFn: ({ versionId, typeName }) => aiApi.verifyDocument({ version_id: versionId, expected_type: typeName }),
    onSuccess: (res) => {
      setVerifyMsg({
        success: res.data.is_valid,
        text: `AI Check: ${res.data.is_valid ? 'Valid' : 'Invalid'} (${res.data.confidence}% confident). ${res.data.reasoning}`
      })
    },
    onError: () => setVerifyMsg({ success: false, text: 'AI Verification failed.' })
  })

  const documentQuery = useDocument(documentId)
  const versionsQuery = useDocumentVersions(documentId)

  const archiveMutation = useMutation({
    mutationFn: () => documentsApi.archiveDocument(documentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['document', documentId] }); queryClient.invalidateQueries({ queryKey: ['documents'] }) },
  })

  const uploadVersionMutation = useMutation({
    mutationFn: (formData) => documentsApi.uploadVersion(documentId, formData),
    onSuccess: () => { setUploadMsg('Version uploaded!'); queryClient.invalidateQueries({ queryKey: ['document', documentId, 'versions'] }); queryClient.invalidateQueries({ queryKey: ['document', documentId] }); queryClient.invalidateQueries({ queryKey: ['documents'] }) },
    onError: () => setUploadMsg('Upload failed.'),
  })

  const doc = documentQuery.data
  const versions = useMemo(() => Array.isArray(versionsQuery.data) ? versionsQuery.data : [], [versionsQuery.data])

  if (!documentId) return <Navigate to="/documents" replace />

  const canArchive = ['admin', 'staff', 'director', 'center_head'].includes(role)
  const canUpload = doc && (['admin', 'staff', 'director', 'center_head'].includes(role) || doc.submitted_by === doc.submitter?.id)
  const canUseDocumentAi = ['admin', 'staff', 'director', 'center_head'].includes(role)

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
      {documentQuery.isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading document…</p>}
      {documentQuery.isError && <p className="text-sm text-[var(--th-btn-danger-text)] py-8 text-center">Failed to load document.</p>}

      {doc && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--th-text)]">{doc.title}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusBadge status={doc.status} />
                <span className="text-xs text-[var(--th-text-muted)]">{doc.document_type?.name || doc.documentType?.name}</span>
                {verifyMsg && (
                  <span className={`text-xs px-2 py-1 rounded ${verifyMsg.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {verifyMsg.text}
                  </span>
                )}
              </div>
            </div>
            <Link to="/documents" className="text-sm text-[var(--th-text-secondary)] hover:text-[var(--th-text)]">← Back</Link>
          </div>

          {/* Metadata grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Submitter', value: doc.submitter?.name || doc.submitter?.email },
              { label: 'Current Step', value: doc.currentStep?.name || doc.current_step?.name || 'Completed' },
              { label: 'Created', value: formatDateTime(doc.created_at) },
              { label: 'Expires', value: doc.expires_at ? formatDateTime(doc.expires_at) : 'Never' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-[var(--th-card-bg)] border border-[var(--th-border-subtle)] p-4">
                <p className="text-[10px] text-[var(--th-text-muted)] uppercase tracking-wider">{label}</p>
                <p className="text-sm text-[var(--th-text)] mt-1">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {canArchive && doc.status !== 'archived' && (
              <button onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}
                className="px-4 py-2 text-xs font-medium text-[var(--th-btn-warning-text)] bg-[var(--th-btn-warning-bg)] border border-[var(--th-btn-warning-border)] hover:bg-[var(--th-btn-warning-hover)] rounded-lg cursor-pointer disabled:opacity-50">
                {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
              </button>
            )}
            {canUpload && (
              <label className="px-4 py-2 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">
                Upload new version
                <input type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
              </label>
            )}
            {uploadMsg && <span className="text-xs text-[var(--th-btn-success-text)]">{uploadMsg}</span>}
          </div>

          {/* Versions */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--th-text)] mb-3">Version History</h3>
            {versionsQuery.isLoading && <p className="text-sm text-[var(--th-loading-text)]">Loading…</p>}
            {versions.length === 0 && !versionsQuery.isLoading && <p className="text-sm text-[var(--th-text-secondary)]">No versions.</p>}
            {versions.length > 0 && (
              <div className="rounded-xl border border-[var(--th-border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Version</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Filename</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Size</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Uploaded</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--th-border-subtle)]">
                    {versions.map((v) => (
                      <tr key={v.id} className="hover:bg-[var(--th-surface-hover)]">
                        <td className="px-4 py-2.5 text-[var(--th-text)] font-medium">v{v.version_number}</td>
                        <td className="px-4 py-2.5 text-[var(--th-text-secondary)] text-xs">{v.original_filename}</td>
                        <td className="px-4 py-2.5 text-[var(--th-text-secondary)] text-xs">{formatFileSize(v.file_size_bytes)}</td>
                        <td className="px-4 py-2.5 text-[var(--th-text-secondary)] text-xs">{formatDateTime(v.created_at)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <a href={`/api/v1/documents/${documentId}/versions/${v.id}/download`}
                            className="text-emerald-400 hover:text-[var(--th-btn-success-text)] text-xs font-medium mr-4">Download</a>
                          {canUseDocumentAi && isAiSupportedVersion(v) && (
                            <>
                              <button onClick={() => setExtractorState({ isOpen: true, versionId: v.id, filename: v.original_filename })}
                                className="text-blue-400 hover:text-blue-500 text-xs font-medium cursor-pointer mr-4">
                                Extract Data
                              </button>
                              <button onClick={() => verifyMutation.mutate({ versionId: v.id, typeName: doc.document_type?.name || doc.documentType?.name })}
                                disabled={verifyMutation.isPending}
                                className="text-purple-400 hover:text-purple-500 text-xs font-medium cursor-pointer disabled:opacity-50">
                                {verifyMutation.isPending ? 'Verifying...' : 'Verify Quality'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* AI Extractor Modal */}
          <LocalAiExtractor 
            isOpen={extractorState.isOpen} 
            versionId={extractorState.versionId} 
            originalFilename={extractorState.filename} 
            onClose={() => setExtractorState({ isOpen: false, versionId: null, filename: '' })} 
          />

          {/* Bilingual Assistant */}
          <div className="mt-8">
            <BilingualAssistant />
          </div>
        </>
      )}
    </div>
  )
}
