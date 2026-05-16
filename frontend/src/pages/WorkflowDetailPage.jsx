import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWorkflow } from '../hooks/useWorkflow'
import { ROLE_LABELS } from '../utils/constants'

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const workflowQuery = useWorkflow(id)
  const wf = workflowQuery.data
  const steps = useMemo(() => Array.isArray(wf?.steps) ? wf.steps.sort((a, b) => a.step_order - b.step_order) : [], [wf])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {workflowQuery.isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {wf && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--th-text)]">{wf.name}</h2>
              <p className="text-sm text-[var(--th-text-secondary)] mt-1">{wf.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to={`/workflows/${id}/edit`} className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg">Edit</Link>
              <Link to="/workflows" className="text-sm text-[var(--th-text-secondary)] hover:text-[var(--th-text)]">← Back</Link>
            </div>
          </div>

          {/* Steps timeline */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--th-text)] mb-4">Steps ({steps.length})</h3>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                      {step.step_order}
                    </div>
                    {i < steps.length - 1 && <div className="w-px h-full bg-[var(--th-surface-hover)] my-1" />}
                  </div>
                  {/* Step content */}
                  <div className="pb-6">
                    <p className="text-sm font-medium text-[var(--th-text)]">{step.name}</p>
                    <p className="text-xs text-[var(--th-text-secondary)] mt-1">
                      Assigned to: <span className="text-[var(--th-text-secondary)]">{ROLE_LABELS[step.assignee_role] || step.assignee_role}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
