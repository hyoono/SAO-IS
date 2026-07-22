import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as workflowsApi from '../api/workflows'
import * as aiApi from '../api/ai'
import { ROLE_LABELS } from '../utils/constants'
import { useCenters } from '../hooks/useCenters'
import { useMemo } from 'react'

const ROLES = ['admin', 'staff', 'org_officer', 'student', 'faculty', 'director', 'center_head']

export default function WorkflowBuilderPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState([{ name: '', assignee_role: 'admin', center_id: '' }])
  const [error, setError] = useState('')

  const { data: centersData } = useCenters()
  const centers = useMemo(() => Array.isArray(centersData) ? centersData : [], [centersData])

  const mutation = useMutation({
    mutationFn: (data) => workflowsApi.createWorkflow(data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['workflows'] }); navigate(`/workflows/${res.data.id}`) },
    onError: (err) => setError(err?.response?.data?.message || 'Failed to create workflow.'),
  })

  const suggestMutation = useMutation({
    mutationFn: (docType) => aiApi.suggestWorkflow({ document_type: docType }),
    onSuccess: (res) => {
      if (res.data.steps && res.data.steps.length > 0) {
        const mappedSteps = res.data.steps.map(s => ({
          name: s.name || 'Approval Step',
          assignee_role: ROLES.includes(s.role) ? s.role : 'staff',
          center_id: ''
        }))
        setSteps(mappedSteps)
      } else {
        setError('AI returned no valid steps.')
      }
    },
    onError: (err) => setError(err?.response?.data?.message || 'Failed to get AI suggestions.')
  })

  const addStep = () => setSteps([...steps, { name: '', assignee_role: 'admin', center_id: '' }])
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
    const payloadSteps = steps.map(s => ({ ...s, center_id: s.center_id || null }))
    mutation.mutate({ name, description: description || null, steps: payloadSteps })
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => suggestMutation.mutate(name)} disabled={suggestMutation.isPending || !name}
                className="px-3 py-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg cursor-pointer disabled:opacity-50 border border-blue-500/20 flex items-center gap-1">
                {suggestMutation.isPending ? 'Suggesting...' : '✨ Auto-Suggest (AI)'}
              </button>
              <button type="button" onClick={addStep}
                className="px-3 py-1.5 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">+ Add Step</button>
            </div>
          </div>

          {steps.map((step, i) => (
            <div key={i} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4 flex gap-4 items-start">
              {/* Step number + reorder */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  step.center_id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                    : 'bg-[var(--th-step-num-bg)] border-[var(--th-step-num-border)] text-[var(--th-step-num-text)]'
                }`}>{i + 1}</div>
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▲</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▼</button>
              </div>

              {/* Step fields */}
              <div className="flex-1 space-y-3">
                {step.center_id && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {centers.find(c => c.id === step.center_id)?.code ?? 'Center'} scoped
                    </span>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
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
                <div>
                  <label className="block text-[10px] text-[var(--th-text-muted)] mb-1">Center (Optional)</label>
                  <select value={step.center_id} onChange={e => updateStep(i, 'center_id', e.target.value)}
                    className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                    <option value="">-- None --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                  </select>
                </div>
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
