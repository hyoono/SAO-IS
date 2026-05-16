import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'

export default function DashboardPage() {
  const { role: paramRole } = useParams()
  const { user, role } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const modules = useMemo(() => Array.isArray(data?.modules) ? data.modules : [], [data])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Welcome, {user?.name || 'User'}</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1 capitalize">{role} Dashboard</p>
      </div>

      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading dashboard…</p>}

      {!isLoading && modules.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <div key={i} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 hover:border-blue-500/20 transition-colors">
              <p className="text-xs text-[var(--th-text-muted)] uppercase tracking-wider">{m.title}</p>
              <p className="text-3xl font-bold text-[var(--th-text)] mt-2">{m.value}</p>
              <p className="text-xs text-[var(--th-text-secondary)] mt-2">{m.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--th-text-secondary)] mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/documents" className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] border border-[var(--th-border)] rounded-lg">View Documents</Link>
          {['student', 'org_officer', 'faculty', 'admin', 'staff'].includes(role) && (
            <Link to="/submit" className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg">Submit Document</Link>
          )}
          {['admin', 'staff', 'faculty'].includes(role) && (
            <Link to="/approvals" className="px-4 py-2 text-xs font-medium text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg">Review Queue</Link>
          )}
          <Link to="/notifications" className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] border border-[var(--th-border)] rounded-lg">Notifications</Link>
        </div>
      </div>
    </div>
  )
}
