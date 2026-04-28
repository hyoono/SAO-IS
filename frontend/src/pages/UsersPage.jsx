import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '../api/users'
import { ROLE_LABELS } from '../utils/constants'
import Pagination from '../components/ui/Pagination.jsx'
import { formatDateTime } from '../utils/formatters'

const ROLES = ['admin', 'staff', 'org_officer', 'student', 'faculty']

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [msg, setMsg] = useState('')

  const params = useMemo(() => {
    const p = { page }
    if (roleFilter) p.role = roleFilter
    return p
  }, [page, roleFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params).then(r => r.data),
  })

  const items = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  const createMutation = useMutation({
    mutationFn: (d) => usersApi.createUser(d),
    onSuccess: () => {
      setMsg('User created.')
      setShowCreate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setMsg(err?.response?.data?.message || 'Failed to create user.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => usersApi.updateUser(id, d),
    onSuccess: () => {
      setMsg('User updated.')
      setEditingUser(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setMsg(err?.response?.data?.message || 'Failed to update user.'),
  })

  const resetForm = () => setForm({ name: '', email: '', password: '', role: 'student' })

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setShowCreate(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMsg('')
    if (editingUser) {
      const payload = { id: editingUser.id, name: form.name, role: form.role }
      if (form.password) payload.password = form.password
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Create and manage user accounts.</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setEditingUser(null); resetForm(); setMsg('') }}
          className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg cursor-pointer">
          {showCreate ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {msg && <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-200">{msg}</div>}

      {/* Create / Edit form */}
      {(showCreate || editingUser) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">{editingUser ? `Edit: ${editingUser.name}` : 'Create User'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingUser} minLength={8}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer disabled:opacity-50">
            {editingUser ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      )}

      {/* Role filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Filter:</span>
        <button onClick={() => { setRoleFilter(''); setPage(1) }}
          className={`px-3 py-1 text-xs rounded-lg cursor-pointer ${!roleFilter ? 'bg-blue-600/80 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>All</button>
        {ROLES.map(r => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
            className={`px-3 py-1 text-xs rounded-lg cursor-pointer ${roleFilter === r ? 'bg-blue-600/80 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Users table */}
      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && <div className="py-16 text-center"><p className="text-slate-400">No users found.</p></div>}

      {items.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/60 border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDateTime(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(u)} className="text-blue-400 hover:text-blue-300 text-xs font-medium cursor-pointer">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination currentPage={data.current_page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  )
}
