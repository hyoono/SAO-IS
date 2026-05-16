import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWorkflows } from '../hooks/useWorkflow'
import Pagination from '../components/ui/Pagination.jsx'
import { useState } from 'react'

export default function WorkflowsPage() {
  const [page, setPage] = useState(1)
  const workflowsQuery = useWorkflows()
  const data = workflowsQuery.data
  const items = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">Workflow Templates</h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">Manage approval workflows.</p>
        </div>
        <Link to="/workflows/new" className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg">
          + New Workflow
        </Link>
      </div>

      {workflowsQuery.isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!workflowsQuery.isLoading && items.length === 0 && (
        <div className="py-16 text-center"><p className="text-[var(--th-text-secondary)]">No workflows configured.</p></div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((wf) => (
            <Link key={wf.id} to={`/workflows/${wf.id}`} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 hover:border-blue-500/20 transition-colors block">
              <p className="text-sm font-semibold text-[var(--th-text)]">{wf.name}</p>
              <p className="text-xs text-[var(--th-text-secondary)] mt-1">{wf.description || 'No description'}</p>
              <p className="text-xs text-[var(--th-text-muted)] mt-3">{wf.steps_count} step{wf.steps_count !== 1 ? 's' : ''}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
