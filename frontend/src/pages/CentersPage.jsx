import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as centersApi from '../api/centers'

export default function CentersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', description: '' })
  const [msg, setMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.getCenters().then(r => r.data),
  })
  const centers = useMemo(() => Array.isArray(data) ? data : [], [data])

  const createMutation = useMutation({
    mutationFn: (d) => centersApi.createCenter(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['centers'] }); reset(); setMsg('Center created.') },
    onError: (e) => setMsg(e?.response?.data?.message || 'Error creating center.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => centersApi.updateCenter(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['centers'] }); reset(); setMsg('Center updated.') },
    onError: (e) => setMsg(e?.response?.data?.message || 'Error updating center.'),
  })

  const reset = () => { setShowForm(false); setEditId(null); setForm({ code: '', name: '', description: '' }) }

  const startEdit = (c) => {
    setEditId(c.id)
    setForm({ code: c.code, name: c.name, description: c.description || '' })
    setShowForm(true)
    setMsg('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editId) {
      updateMutation.mutate({ id: editId, ...form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Centers</h2>
          <p className="text-sm text-slate-400 mt-1">Manage SAO centers and offices.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); setMsg('') }}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
          + New Center
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-300">{msg}</p>}

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Center' : 'New Center'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. CSAD" maxLength={10} required disabled={!!editId} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Full center name" required />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Optional description" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
              {editId ? 'Save Changes' : 'Create Center'}
            </button>
            <button type="button" onClick={reset} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Centers Table */}
      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && centers.length === 0 && (
        <div className="py-16 text-center"><p className="text-slate-400">No centers configured.</p></div>
      )}

      {centers.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {centers.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{c.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
