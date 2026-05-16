import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDocumentTypes } from '../hooks/useDocuments'
import * as documentsApi from '../api/documents'

export default function SubmitDocumentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  const dtQuery = useDocumentTypes()
  const documentTypes = useMemo(() => Array.isArray(dtQuery.data) ? dtQuery.data : [], [dtQuery.data])

  const submitMutation = useMutation({
    mutationFn: (formData) => documentsApi.submitDocument(formData),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
      navigate(`/documents/${res.data.id}`)
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.response?.data?.errors?.file?.[0] || 'Submission failed.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const fd = new FormData()
    fd.append('document_type_id', documentTypeId)
    fd.append('title', title)
    fd.append('file', file)
    submitMutation.mutate(fd)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-[var(--th-text)]">Submit Document</h2>
      <p className="text-sm text-[var(--th-text-secondary)] mt-1 mb-6">Upload a new document to start workflow processing.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {dtQuery.isLoading && <p className="text-sm text-blue-200/80">Loading document types…</p>}

      {!dtQuery.isLoading && documentTypes.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-6">
          <div>
            <label htmlFor="document_type_id" className="block text-sm font-medium text-[var(--th-text-secondary)] mb-2">Document Type</label>
            <select id="document_type_id" value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value)} required
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="">Select a type</option>
              {documentTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--th-text-secondary)] mb-2">Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Enter document title"
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-[var(--th-text-secondary)] mb-2">File</label>
            <input id="file" type="file" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} required
              className="block w-full text-sm text-[var(--th-text-secondary)] file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-100 hover:file:bg-blue-500/25" />
            {file && <p className="mt-1 text-xs text-[var(--th-text-muted)]">Selected: {file.name}</p>}
          </div>
          <button type="submit" disabled={submitMutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
            {submitMutation.isPending ? 'Submitting…' : 'Submit document'}
          </button>
        </form>
      )}

      {!dtQuery.isLoading && documentTypes.length === 0 && !dtQuery.isError && (
        <p className="text-sm text-[var(--th-text-secondary)]">No document types configured yet.</p>
      )}
    </div>
  )
}
