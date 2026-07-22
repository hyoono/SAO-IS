import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '../api/users'
import { ROLE_LABELS } from '../utils/constants'
import Pagination from '../components/ui/Pagination.jsx'
import { formatDateTime } from '../utils/formatters'
import { useCenters } from '../hooks/useCenters'

const ROLES = Object.keys(ROLE_LABELS)

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', center_id: '' })
  const [msg, setMsg] = useState('')

  const { data: centersData } = useCenters()
  const centers = useMemo(() => Array.isArray(centersData) ? centersData : [], [centersData])

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

  const resetForm = () => setForm({ name: '', email: '', password: '', role: 'student', center_id: '' })

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, center_id: user.center_id || '' })
    setShowCreate(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMsg('')
    if (editingUser) {
      const payload = { id: editingUser.id, name: form.name, role: form.role, center_id: form.center_id || null }
      if (form.password) payload.password = form.password
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate({ ...form, center_id: form.center_id || null })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">User Management</h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">Create and manage user accounts.</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setEditingUser(null); resetForm(); setMsg('') }}
          className="px-4 py-2 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] border border-[var(--th-btn-primary-border)] hover:bg-[var(--th-btn-primary-hover)] rounded-lg cursor-pointer">
          {showCreate ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {msg && <div className="rounded-lg border border-[var(--th-msg-info-border)] bg-[var(--th-msg-info-bg)] px-4 py-3 text-sm text-[var(--th-btn-primary-text)]">{msg}</div>}

      {/* Create / Edit form */}
      {(showCreate || editingUser) && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--th-text)]">{editingUser ? `Edit: ${editingUser.name}` : 'Create User'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
            )}
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingUser} minLength={8}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1.5">Center (Optional)</label>
              <select value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="">-- None --</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
            className="px-5 py-2 text-xs font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer disabled:opacity-50">
            {editingUser ? 'Save Changes' : 'Create User'}
          </button>
        </form>
      )}

      {/* Role filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--th-text-muted)]">Filter:</span>
        <button onClick={() => { setRoleFilter(''); setPage(1) }}
          className={`px-3 py-1 text-xs rounded-lg cursor-pointer ${!roleFilter ? 'bg-blue-600/80 text-[var(--th-text)]' : 'bg-[var(--th-surface)] text-[var(--th-text-secondary)] hover:bg-[var(--th-surface-hover)]'}`}>All</button>
        {ROLES.map(r => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
            className={`px-3 py-1 text-xs rounded-lg cursor-pointer ${roleFilter === r ? 'bg-blue-600/80 text-[var(--th-text)]' : 'bg-[var(--th-surface)] text-[var(--th-text-secondary)] hover:bg-[var(--th-surface-hover)]'}`}>
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Users table */}
      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && <div className="py-16 text-center"><p className="text-[var(--th-text-secondary)]">No users found.</p></div>}

      {items.length > 0 && (
        <>
          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {items.map((u) => (
              <div key={u.id} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--th-text)]">{u.name}</p>
                    <p className="text-xs text-[var(--th-text-muted)] mt-0.5 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[var(--th-badge-bg)] text-[var(--th-badge-text)] border border-[var(--th-badge-border)] flex-shrink-0">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                    {u.center && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-medium bg-[var(--th-surface-hover)] text-[var(--th-text-secondary)] flex-shrink-0">
                        {u.center.code}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[var(--th-text-muted)]">{formatDateTime(u.created_at)}</span>
                  <button onClick={() => openEdit(u)} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)] text-xs font-medium cursor-pointer">Edit</button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block rounded-xl border border-[var(--th-border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--th-surface-alt)] border-b border-[var(--th-border-subtle)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Center</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--th-text-secondary)] uppercase">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--th-border-subtle)]">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--th-surface-hover)]">
                    <td className="px-4 py-3 text-[var(--th-text)] font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[var(--th-badge-bg)] text-[var(--th-badge-text)] border border-[var(--th-badge-border)]">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">
                      {u.center ? u.center.code : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--th-text-muted)] text-xs">{formatDateTime(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(u)} className="text-[var(--th-link)] hover:text-[var(--th-link-hover)] text-xs font-medium cursor-pointer">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data && <Pagination currentPage={data.current_page} lastPage={data.last_page} onPageChange={setPage} />}
    </div>
  )
}
