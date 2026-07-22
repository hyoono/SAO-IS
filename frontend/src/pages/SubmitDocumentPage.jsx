import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDocumentTypes } from '../hooks/useDocuments'
import * as documentsApi from '../api/documents'
import * as aiApi from '../api/ai'

export default function SubmitDocumentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [aiHelperText, setAiHelperText] = useState('')
  const [aiMessage, setAiMessage] = useState('')

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

  const classifyMutation = useMutation({
    mutationFn: (text) => {
      const typesList = documentTypes.map(t => ({ id: t.id, name: t.name }))
      return aiApi.classifyDocument({ description: text, available_types: typesList })
    },
    onSuccess: (res) => {
      if (res.data.matched_id) {
        setDocumentTypeId(res.data.matched_id)
        setAiMessage('✨ AI selected the best matching document type.')
      } else {
        setAiMessage('AI could not find a matching document type.')
      }
    },
    onError: () => setAiMessage('Failed to classify using AI.')
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
        <div className="mb-4 rounded-lg border border-[var(--th-msg-error-border)] bg-[var(--th-msg-error-bg)] px-4 py-3 text-sm text-[var(--th-btn-danger-text)]">{error}</div>
      )}

      {dtQuery.isLoading && <p className="text-sm text-[var(--th-loading-text)]">Loading document types…</p>}

      {!dtQuery.isLoading && documentTypes.length > 0 && (
        <div className="space-y-6">
          {/* AI Helper Box */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <h3 className="text-sm font-semibold text-[var(--th-text)] flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Not sure which type? Let AI decide
            </h3>
            <div className="flex gap-2">
              <input type="text" value={aiHelperText} onChange={e => setAiHelperText(e.target.value)}
                placeholder="e.g. I need to submit my foundation day clearance"
                className="flex-1 rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <button type="button" onClick={() => { setAiMessage(''); classifyMutation.mutate(aiHelperText) }} disabled={!aiHelperText || classifyMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50 flex shrink-0 items-center gap-1">
                {classifyMutation.isPending ? 'Thinking...' : 'Auto-select'}
              </button>
            </div>
            {aiMessage && <p className="text-xs mt-2 text-blue-400">{aiMessage}</p>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-6">
          <div>
            <label htmlFor="document_type_id" className="block text-sm font-medium text-[var(--th-text-secondary)] mb-2">Document Type</label>
            <select id="document_type_id" value={documentTypeId} onChange={(e) => setDocumentTypeId(e.target.value)} required
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="">Select a type</option>
              {/* Group by center */}
              {(() => {
                const grouped = documentTypes.reduce((acc, t) => {
                  const key = t.center ? t.center.code : 'General'
                  if (!acc[key]) acc[key] = []
                  acc[key].push(t)
                  return acc
                }, {})
                return Object.entries(grouped).map(([centerCode, types]) => (
                  <optgroup key={centerCode} label={centerCode === 'General' ? 'General' : `${centerCode}`}>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))
              })()}
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
        </div>
      )}

      {!dtQuery.isLoading && documentTypes.length === 0 && !dtQuery.isError && (
        <p className="text-sm text-[var(--th-text-secondary)]">No document types configured yet.</p>
      )}
    </div>
  )
}
