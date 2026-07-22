import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as dtApi from '../api/documentTypes'
import { useWorkflows } from '../hooks/useWorkflow'
import { useCenters } from '../hooks/useCenters'

export default function DocumentTypesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', workflow_template_id: '', expiry_days: '', center_id: '' })
  const [msg, setMsg] = useState('')

  const { data: centersData } = useCenters()
  const centers = useMemo(() => Array.isArray(centersData) ? centersData : [], [centersData])

  const { data, isLoading } = useQuery({ queryKey: ['document-types'], queryFn: () => dtApi.getDocumentTypes().then(r => r.data) })
  const wfQuery = useWorkflows()
  const workflows = useMemo(() => Array.isArray(wfQuery.data?.data) ? wfQuery.data.data : [], [wfQuery.data])
  const items = useMemo(() => Array.isArray(data) ? data : [], [data])

  const createMut = useMutation({ mutationFn: (d) => dtApi.createDocumentType(d), onSuccess: () => { setMsg('Created.'); setShowForm(false); qc.invalidateQueries({ queryKey: ['document-types'] }) } })
  const updateMut = useMutation({ mutationFn: ({ id, ...d }) => dtApi.updateDocumentType(id, d), onSuccess: () => { setMsg('Updated.'); setEditing(null); qc.invalidateQueries({ queryKey: ['document-types'] }) } })

  const openEdit = (dt) => { setEditing(dt); setForm({ name: dt.name, workflow_template_id: dt.workflow_template_id || '', expiry_days: dt.expiry_days || '', center_id: dt.center_id || '' }); setShowForm(false) }
  const handleSubmit = (e) => {
    e.preventDefault(); setMsg('')
    const p = { name: form.name, workflow_template_id: form.workflow_template_id || null, expiry_days: form.expiry_days ? parseInt(form.expiry_days) : null, center_id: form.center_id || null }
    editing ? updateMut.mutate({ id: editing.id, ...p }) : createMut.mutate(p)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">Document Types</h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">Configure document categories and their workflow assignments.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', workflow_template_id: '', expiry_days: '', center_id: '' }); setMsg('') }}
          className="px-4 py-2 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">
          {showForm ? 'Cancel' : '+ New Type'}
        </button>
      </div>
      {msg && <div className="rounded-lg border border-[var(--th-msg-info-border)] bg-[var(--th-msg-info-bg)] px-4 py-3 text-sm text-[var(--th-btn-primary-text)]">{msg}</div>}
      {(showForm || editing) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--th-text)]">{editing ? `Edit: ${editing.name}` : 'New Document Type'}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Workflow</label>
              <select value={form.workflow_template_id} onChange={e => setForm({ ...form, workflow_template_id: e.target.value })} required className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="">Select</option>
                {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Center (Optional)</label>
              <select value={form.center_id} onChange={e => setForm({ ...form, center_id: e.target.value })} className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="">-- None --</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Expiry (days)</label>
              <input type="number" value={form.expiry_days} onChange={e => setForm({ ...form, expiry_days: e.target.value })} min={1} placeholder="Optional" className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
          </div>
          <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-5 py-2 text-xs font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer disabled:opacity-50">{editing ? 'Save' : 'Create'}</button>
        </form>
      )}
      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}
      {!isLoading && items.length === 0 && <div className="py-16 text-center"><p className="text-[var(--th-text-secondary)]">No document types.</p></div>}
      {items.length > 0 && (
        <div className="rounded-xl border border-[var(--th-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Workflow</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Center</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Expiry</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--th-border-subtle)]">
              {items.map(dt => (
                <tr key={dt.id} className="hover:bg-[var(--th-surface-hover)]">
                  <td className="px-4 py-3 text-[var(--th-text)] font-medium">{dt.name}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{dt.workflow_template?.name || '—'}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{dt.center ? dt.center.code : '—'}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{dt.expiry_days ? `${dt.expiry_days} days` : 'Never'}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEdit(dt)} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)] text-xs font-medium cursor-pointer">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
