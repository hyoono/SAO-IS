import { Link, Navigate } from 'react-router-dom'
import { useWorkflows } from '../hooks/useWorkflow'
import { useAuth } from '../hooks/useAuth'

function WorkflowRow({ workflow }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{workflow.name || workflow.title || `Workflow #${workflow.id}`}</p>
      <p className="mt-1 text-xs text-slate-400">ID: {workflow.id}</p>
      <p className="mt-2 text-sm text-slate-300">
        {workflow.description || 'No description available yet.'}
      </p>
      <p className="mt-3 text-xs text-blue-200/90">
        Steps: {workflow.steps_count ?? 0}
      </p>
      <Link
        to={`/workflows/${workflow.id}`}
        className="mt-4 inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
      >
        Open workflow
      </Link>
    </div>
  )
}

export default function WorkflowsPage() {
  const { user, role } = useAuth()
  const { data, isLoading, isError, error } = useWorkflows()

  if (role !== 'admin') {
    return <Navigate to={`/dashboard/${role || 'student'}`} replace />
  }

  const workflows = Array.isArray(data?.data) ? data.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Workflow Templates</h1>
            <p className="text-slate-300 mt-2">
              Signed in as {user?.name || 'Admin'} ({user?.email || 'N/A'})
            </p>
          </div>

          <Link
            to="/dashboard/admin"
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          {isLoading && (
            <p className="text-sm text-blue-200/80">Loading workflows...</p>
          )}

          {isError && (
            <p className="text-sm text-amber-200/90">
              Unable to load workflows right now.
              {error?.response?.status ? ` (HTTP ${error.response.status})` : ''}
            </p>
          )}

          {!isLoading && !isError && workflows.length === 0 && (
            <p className="text-sm text-slate-300">No workflow templates found yet.</p>
          )}

          {!isLoading && !isError && workflows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 mt-1">
              {workflows.map((workflow) => (
                <WorkflowRow key={workflow.id} workflow={workflow} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
