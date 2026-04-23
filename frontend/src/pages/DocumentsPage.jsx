import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useDocuments, useDocumentSearch } from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'

function DocumentRow({ document }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{document.title || `Document #${document.id}`}</p>
      <p className="mt-1 text-xs text-slate-400">
        ID: {document.id} | Status: {document.status || 'N/A'}
      </p>
      <p className="mt-2 text-sm text-slate-300">
        Type: {document.document_type?.name || document.documentType?.name || 'N/A'}
      </p>
      <p className="mt-1 text-xs text-blue-200/90">
        Submitted by: {document.submitter?.name || document.submitter?.email || 'N/A'}
      </p>
      <Link
        to={`/documents/${document.id}`}
        className="mt-4 inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
      >
        Open document
      </Link>
    </div>
  )
}

export default function DocumentsPage() {
  const { role } = useAuth()
  const [query, setQuery] = useState('')

  const documentsQuery = useDocuments({})
  const searchQuery = useDocumentSearch(query.trim())

  const activeItems = useMemo(() => {
    if (query.trim()) {
      return Array.isArray(searchQuery.data) ? searchQuery.data : []
    }

    return Array.isArray(documentsQuery.data?.data) ? documentsQuery.data.data : []
  }, [query, searchQuery.data, documentsQuery.data])

  const isLoading = query.trim() ? searchQuery.isLoading : documentsQuery.isLoading
  const isError = query.trim() ? searchQuery.isError : documentsQuery.isError

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Documents</h1>
            <p className="text-slate-300 mt-2">Browse your accessible documents and quick search by title.</p>
          </div>

          <Link
            to={`/dashboard/${role || 'student'}`}
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          <label htmlFor="doc-search" className="block text-sm text-blue-100 mb-2">Search</label>
          <input
            id="doc-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
            className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />

          {isLoading && <p className="mt-4 text-sm text-blue-200/80">Loading documents...</p>}
          {isError && <p className="mt-4 text-sm text-amber-200/90">Unable to load documents right now.</p>}

          {!isLoading && !isError && activeItems.length === 0 && (
            <p className="mt-4 text-sm text-slate-300">No documents found for this view.</p>
          )}

          {!isLoading && !isError && activeItems.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {activeItems.map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
