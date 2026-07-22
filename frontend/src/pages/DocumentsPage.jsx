import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments, useDocumentSearch, useDocumentTypes } from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../api/ai'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import FilterPanel from '../components/ui/FilterPanel.jsx'
import Pagination from '../components/ui/Pagination.jsx'

export default function DocumentsPage({ myOnly = false, archived = false }) {
  const { role } = useAuth()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [aiMessage, setAiMessage] = useState('')

  const parseSearchMutation = useMutation({
    mutationFn: (text) => aiApi.parseSearch({ query: text }),
    onSuccess: (res) => {
      const data = res.data
      setFilters(prev => ({
        ...prev,
        status: data.status || prev.status,
      }))
      setQuery(data.search || '')
      setAiMessage(`✨ AI applied filters: ${data.status ? `Status=${data.status}` : ''} ${data.date_range ? `Date=${data.date_range}` : ''}`.trim() || 'AI did not find any specific filters.')
    },
    onError: () => setAiMessage('AI search parsing failed.')
  })

  const params = useMemo(() => {
    const p = { page }
    if (archived) p.status = 'archived'
    if (filters.status && !archived) p.status = filters.status
    if (filters.type) p.document_type_id = filters.type
    return p
  }, [page, filters, archived])

  const documentsQuery = useDocuments(params)
  const searchQuery = useDocumentSearch(query.trim())
  const documentTypesQuery = useDocumentTypes()

  const isSearching = query.trim().length > 0
  const paginatedData = documentsQuery.data
  const items = useMemo(() => {
    if (isSearching) return Array.isArray(searchQuery.data) ? searchQuery.data : []
    return Array.isArray(paginatedData?.data) ? paginatedData.data : []
  }, [isSearching, searchQuery.data, paginatedData])

  const isLoading = isSearching ? searchQuery.isLoading : documentsQuery.isLoading
  const docTypes = useMemo(() => Array.isArray(documentTypesQuery.data) ? documentTypesQuery.data : [], [documentTypesQuery.data])

  const handleFilter = useCallback((f) => { setFilters(f); setPage(1) }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">
            {archived ? 'Archived Documents' : myOnly ? 'My Submissions' : 'Documents'}
          </h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">
            {archived ? 'Previously archived documents.' : 'Browse and search documents.'}
          </p>
        </div>
        {!archived && (
          <Link to="/submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 px-4 py-2 text-sm font-medium text-[var(--th-text)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Submit
          </Link>
        )}
      </div>

      {/* Search bar */}
      <div>
        <div className="flex gap-2">
          <input id="doc-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or ask AI (e.g., 'pending documents')..."
            className="flex-1 rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-4 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          <button onClick={() => { setAiMessage(''); parseSearchMutation.mutate(query) }} disabled={!query || parseSearchMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {parseSearchMutation.isPending ? 'Thinking...' : 'AI Search'}
          </button>
        </div>
        {aiMessage && <p className="text-xs text-blue-400 mt-2">{aiMessage}</p>}
      </div>

      {/* Filters */}
      {!archived && <FilterPanel documentTypes={docTypes} onFilter={handleFilter} />}

      {/* Content */}
      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[var(--th-text-secondary)]">No documents found.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {items.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`}
                className="block rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4 hover:bg-[var(--th-surface-hover)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--th-text)] truncate">{doc.title}</p>
                    <p className="text-xs text-[var(--th-text-muted)] mt-1">{doc.document_type?.name || doc.documentType?.name || '—'}</p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-[var(--th-text-secondary)]">
                  <span>{doc.submitter?.name || '—'}</span>
                  <span>{doc.current_step?.name || doc.currentStep?.name || '—'}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block rounded-xl border border-[var(--th-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Submitter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Current Step</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--th-border-subtle)]">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--th-surface-hover)] transition-colors">
                    <td className="px-4 py-3 text-[var(--th-text)] font-medium">{doc.title}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)]">{doc.document_type?.name || doc.documentType?.name || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)]">{doc.submitter?.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{doc.current_step?.name || doc.currentStep?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/documents/${doc.id}`} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)] text-xs font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {!isSearching && paginatedData && (
        <Pagination currentPage={paginatedData.current_page} lastPage={paginatedData.last_page} onPageChange={setPage} />
      )}
    </div>
  )
}
