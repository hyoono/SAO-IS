import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocument, useDocumentVersions } from '../hooks/useDocuments'
import * as documentsApi from '../api/documents'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const documentId = id || ''
  const { role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const documentQuery = useDocument(documentId)
  const versionsQuery = useDocumentVersions(documentId)

  const archiveMutation = useMutation({
    mutationFn: () => documentsApi.archiveDocument(documentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const uploadVersionMutation = useMutation({
    mutationFn: (formData) => documentsApi.uploadVersion(documentId, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['document', documentId, 'versions'] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const document = documentQuery.data
  const versions = useMemo(() => {
    if (Array.isArray(versionsQuery.data)) {
      return versionsQuery.data
    }

    return []
  }, [versionsQuery.data])

  if (!documentId) {
    return <Navigate to="/documents" replace />
  }

  const canArchive = ['admin', 'staff'].includes(role)
  const canUpload = Boolean(document) && (['admin', 'staff'].includes(role) || document?.submitted_by === document?.submitter?.id)

  const handleVersionUpload = (event) => {
    const uploadedFile = event.target.files?.[0]

    if (!uploadedFile) {
      return
    }

    const formData = new FormData()
    formData.append('file', uploadedFile)
    uploadVersionMutation.mutate(formData)
    event.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Document Details</h1>
            <p className="text-slate-300 mt-2">Inspect the selected document and its version history.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to documents
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
          {documentQuery.isLoading && <p className="text-sm text-blue-200/80">Loading document...</p>}

          {documentQuery.isError && (
            <p className="text-sm text-amber-200/90">Unable to load this document right now.</p>
          )}

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
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Type</p>
                  <p className="text-lg mt-1">{document.documentType?.name || document.document_type?.name || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Submitter</p>
                  <p className="text-lg mt-1">{document.submitter?.name || document.submitter?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Current Step</p>
                <p className="text-lg mt-1">{document.currentStep?.name || document.current_step?.name || 'N/A'}</p>
              </div>

              {canArchive && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                    className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
                  >
                    {archiveMutation.isPending ? 'Archiving...' : 'Archive document'}
                  </button>
                  {archiveMutation.isSuccess && (
                    <p className="text-sm text-emerald-200">Document archived successfully.</p>
                  )}
                </div>
              )}

              {canUpload && (
                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">Upload new version</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleVersionUpload}
                    className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-100 hover:file:bg-blue-500/25"
                  />
                  {uploadVersionMutation.isPending && (
                    <p className="mt-2 text-xs text-blue-200/80">Uploading version...</p>
                  )}
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold">Versions</h2>
                {versionsQuery.isLoading && <p className="mt-2 text-sm text-blue-200/80">Loading versions...</p>}
                {versionsQuery.isError && <p className="mt-2 text-sm text-amber-200/90">Unable to load versions.</p>}
                {!versionsQuery.isLoading && !versionsQuery.isError && versions.length === 0 && (
                  <p className="mt-2 text-sm text-slate-300">No versions found for this document.</p>
                )}
                {!versionsQuery.isLoading && !versionsQuery.isError && versions.length > 0 && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {versions.map((version) => (
                      <div key={version.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-sm font-semibold">Version {version.version_number}</p>
                        <p className="mt-1 text-xs text-slate-400">File: {version.original_filename || 'N/A'}</p>
                        <p className="mt-1 text-xs text-slate-400">Uploaded at: {version.created_at || 'N/A'}</p>
                        <a
                          href={`/api/v1/documents/${documentId}/versions/${version.id}/download`}
                          className="mt-3 inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                        >
                          Download
                        </a>
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
