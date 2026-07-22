import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWorkflow } from '../hooks/useWorkflow'
import * as workflowsApi from '../api/workflows'
import { ROLE_LABELS } from '../utils/constants'
import { useCenters } from '../hooks/useCenters'

const ROLES = ['admin', 'staff', 'org_officer', 'student', 'faculty', 'director', 'center_head']

export default function WorkflowEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const workflowQuery = useWorkflow(id)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const { data: centersData } = useCenters()
  const centers = useMemo(() => Array.isArray(centersData) ? centersData : [], [centersData])

  useEffect(() => {
    if (workflowQuery.data && !loaded) {
      const wf = workflowQuery.data
      setName(wf.name)
      setDescription(wf.description || '')
      const sorted = [...(wf.steps || [])].sort((a, b) => a.step_order - b.step_order)
      setSteps(sorted.map(s => ({ name: s.name, assignee_role: s.assignee_role, center_id: s.center_id || '' })))
      setLoaded(true)
    }
  }, [workflowQuery.data, loaded])

  const mutation = useMutation({
    mutationFn: (data) => workflowsApi.updateWorkflow(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); qc.invalidateQueries({ queryKey: ['workflow', id] }); navigate(`/workflows/${id}`) },
    onError: (err) => setError(err?.response?.data?.message || 'Failed.'),
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

  if (workflowQuery.isLoading) return <div className="max-w-3xl mx-auto py-8"><p className="text-sm text-[var(--th-loading-text)] text-center">Loading…</p></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">Edit Workflow</h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">Modify steps and reassign roles.</p>
        </div>
        <button onClick={() => navigate(`/workflows/${id}`)} className="text-sm text-[var(--th-text-secondary)] hover:text-[var(--th-text)] cursor-pointer">← Back</button>
      </div>

      {error && <div className="rounded-lg border border-[var(--th-msg-error-border)] bg-[var(--th-msg-error-bg)] px-4 py-3 text-sm text-[var(--th-btn-danger-text)]">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
          <div>
            <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Workflow Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
          <div>
            <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--th-text)]">Steps</h3>
            <button type="button" onClick={addStep} className="px-3 py-1.5 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">+ Add</button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4 flex gap-4 items-start">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  step.center_id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                    : 'bg-[var(--th-step-num-bg)] border-[var(--th-step-num-border)] text-[var(--th-step-num-text)]'
                }`}>{i + 1}</div>
                <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▲</button>
                <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] disabled:opacity-20 cursor-pointer text-xs">▼</button>
              </div>
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
                    <input type="text" value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} required
                      className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--th-text-muted)] mb-1">Role</label>
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
              {steps.length > 1 && <button type="button" onClick={() => removeStep(i)} className="text-red-400/60 hover:text-red-400 text-xs mt-1 cursor-pointer">✕</button>}
            </div>
          ))}
        </div>

        <button type="submit" disabled={mutation.isPending}
          className="px-6 py-2.5 text-sm font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer disabled:opacity-50">
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
