import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTypes } from '../hooks/useDocuments'
import * as documentsApi from '../api/documents'

export default function SubmitDocumentPage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  const documentTypesQuery = useDocumentTypes()
  const documentTypes = useMemo(() => Array.isArray(documentTypesQuery.data) ? documentTypesQuery.data : [], [documentTypesQuery.data])

  const submitMutation = useMutation({
    mutationFn: (formData) => documentsApi.submitDocument(formData),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      navigate(`/documents/${response.data.id}`)
    },
    onError: (err) => {
      const message = err?.response?.data?.message
        || err?.response?.data?.errors?.file?.[0]
        || err?.response?.data?.errors?.title?.[0]
        || 'Unable to submit document.'
      setError(message)
    },
  })

  if (!['student', 'org_officer', 'faculty', 'admin', 'staff'].includes(role)) {
    return <Navigate to={`/dashboard/${role || 'student'}`} replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const formData = new FormData()
    formData.append('document_type_id', documentTypeId)
    formData.append('title', title)
    formData.append('file', file)

    submitMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Submit Document</h1>
            <p className="text-slate-300 mt-2">Create a new submission and start workflow processing.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/documents`}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Documents
            </Link>
            <Link
              to={`/dashboard/${role || 'student'}`}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {documentTypesQuery.isLoading && (
            <p className="text-sm text-blue-200/80">Loading document types...</p>
          )}

          {documentTypesQuery.isError && (
            <p className="text-sm text-amber-200/90">Unable to load document types right now.</p>
          )}

          {!documentTypesQuery.isLoading && documentTypes.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="document_type_id" className="block text-sm font-medium text-slate-300 mb-2">
                  Document Type
                </label>
                <select
                  id="document_type_id"
                  value={documentTypeId}
                  onChange={(e) => setDocumentTypeId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">Select a document type</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                  Document Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter a document title"
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-sm font-medium text-slate-300 mb-2">
                  File Attachment
                </label>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-100 hover:file:bg-blue-500/25"
                />
                {file && <p className="mt-2 text-xs text-slate-400">Selected: {file.name}</p>}
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit document'}
              </button>
            </form>
          )}

          {!documentTypesQuery.isLoading && documentTypes.length === 0 && !documentTypesQuery.isError && (
            <p className="text-sm text-slate-300">No document types found yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
