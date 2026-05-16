import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments, useDocumentSearch, useDocumentTypes } from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import FilterPanel from '../components/ui/FilterPanel.jsx'
import Pagination from '../components/ui/Pagination.jsx'

export default function DocumentsPage({ myOnly = false, archived = false }) {
  const { role } = useAuth()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})

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
        <input id="doc-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, filename, or type…"
          className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-4 py-2.5 text-sm text-[var(--th-text)] placeholder:text-[var(--th-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
      </div>

      {/* Filters */}
      {!archived && <FilterPanel documentTypes={docTypes} onFilter={handleFilter} />}

      {/* Content */}
      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[var(--th-text-secondary)]">No documents found.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="rounded-xl border border-[var(--th-border)] overflow-hidden">
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
                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[var(--th-text)] font-medium">{doc.title}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)]">{doc.document_type?.name || doc.documentType?.name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)]">{doc.submitter?.name || '—'}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{doc.current_step?.name || doc.currentStep?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/documents/${doc.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isSearching && paginatedData && (
        <Pagination currentPage={paginatedData.current_page} lastPage={paginatedData.last_page} onPageChange={setPage} />
      )}
    </div>
  )
}
