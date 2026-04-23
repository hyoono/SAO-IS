import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { useWorkflow } from '../hooks/useWorkflow'
import * as workflowsApi from '../api/workflows'

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const workflowId = id || ''
  const { role } = useAuth()
  const navigate = useNavigate()

  const workflowQuery = useWorkflow(workflowId)
  const stepsQuery = useQuery({
    queryKey: ['workflow', workflowId, 'steps'],
    queryFn: () => workflowsApi.getWorkflowSteps(workflowId).then((r) => r.data),
    enabled: !!workflowId,
  })

  if (!workflowId) {
    return <Navigate to="/workflows" replace />
  }

  const workflow = workflowQuery.data
  const steps = Array.isArray(stepsQuery.data)
    ? stepsQuery.data
    : Array.isArray(workflow?.steps)
      ? workflow.steps
      : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Workflow Details</h1>
            <p className="text-slate-300 mt-2">Inspect template metadata and workflow steps.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/workflows')}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to workflows
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
          {workflowQuery.isLoading && <p className="text-sm text-blue-200/80">Loading workflow...</p>}
          {workflowQuery.isError && <p className="text-sm text-amber-200/90">Unable to load this workflow.</p>}

          {!workflowQuery.isLoading && !workflowQuery.isError && workflow && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Name</p>
                  <p className="text-lg mt-1">{workflow.name || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Template ID</p>
                  <p className="text-lg mt-1 break-all">{workflow.id || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Description</p>
                <p className="text-base mt-1 text-slate-200">{workflow.description || 'No description available.'}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold">Steps</h2>
                {stepsQuery.isLoading && <p className="mt-2 text-sm text-blue-200/80">Loading steps...</p>}
                {stepsQuery.isError && <p className="mt-2 text-sm text-amber-200/90">Unable to load steps.</p>}
                {!stepsQuery.isLoading && !stepsQuery.isError && steps.length === 0 && (
                  <p className="mt-2 text-sm text-slate-300">No workflow steps found.</p>
                )}
                {!stepsQuery.isLoading && !stepsQuery.isError && steps.length > 0 && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {steps.map((step) => (
                      <div key={step.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-sm font-semibold">{step.name || 'Unnamed step'}</p>
                        <p className="mt-1 text-xs text-slate-400">Order: {step.step_order ?? 'N/A'}</p>
                        <p className="mt-1 text-xs text-slate-400">Assignee role: {step.assignee_role || 'N/A'}</p>
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
