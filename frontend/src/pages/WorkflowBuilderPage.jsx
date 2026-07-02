import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as workflowsApi from '../api/workflows'
import { ROLE_LABELS } from '../utils/constants'

const ROLES = ['admin', 'staff', 'org_officer', 'student', 'faculty']

export default function WorkflowBuilderPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState([{ name: '', assignee_role: 'admin' }])
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => workflowsApi.createWorkflow(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['workflows'] }); navigate(`/workflows/${res.data.id}`) },
    onError: (err) => setError(err?.response?.data?.message || 'Failed to create workflow.'),
  })

  const addStep = () => setSteps([...steps, { name: '', assignee_role: 'admin' }])
  const removeStep = (i) => { if (steps.length > 1) setSteps(steps.filter((_, idx) => idx !== i)) }
  const updateStep = (i, field, value) => { const s = [...steps]; s[i] = { ...s[i], [field]: value }; setSteps(s) }
  const moveStep = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const s = [...steps]; [s[i], s[j]] = [s[j], s[i]]; setSteps(s)
  }

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (steps.some(s => !s.name.trim())) { setError('All steps must have a name.'); return }
    mutation.mutate({ name, description: description || null, steps })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Create Workflow</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1">Define the approval steps for a new workflow template.</p>
      </div>

      {error && <div className="rounded-lg border border-[var(--th-msg-error-border)] bg-[var(--th-msg-error-bg)] px-4 py-3 text-sm text-[var(--th-btn-danger-text)]">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
          <div>
            <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Workflow Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Student Clearance Approval"
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
          <div>
            <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Describe this workflow…"
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
        </div>

        {/* Steps builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--th-text)]">Approval Steps</h3>
            <button type="button" onClick={addStep}
              className="px-3 py-1.5 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">+ Add Step</button>
          </div>

          {steps.map((step, i) => (
            <div key={i} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4 flex gap-4 items-start">
              {/* Step number + reorder */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-7 h-7 rounded-full bg-[var(--th-step-num-bg)] border border-[var(--th-step-num-border)] flex items-center justify-center text-xs font-bold text-[var(--th-step-num-text)]">{i + 1}</div>
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▲</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▼</button>
              </div>

              {/* Step fields */}
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] text-[var(--th-text-muted)] mb-1">Step Name</label>
                  <input type="text" value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} required placeholder="e.g. Admin Review"
                    className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--th-text-muted)] mb-1">Assignee Role</label>
                  <select value={step.assignee_role} onChange={e => updateStep(i, 'assignee_role', e.target.value)}
                    className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Remove */}
              {steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} className="text-red-400/60 hover:text-red-400 text-xs mt-1 cursor-pointer" title="Remove step">✕</button>
              )}
            </div>
          ))}
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="px-6 py-2.5 text-sm font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer disabled:opacity-50">
          {mutation.isPending ? 'Creating…' : 'Create Workflow'}
        </button>
      </form>
    </div>
  )
}
