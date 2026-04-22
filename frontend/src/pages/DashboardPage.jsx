import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ROLE_TITLES = {
  admin: 'Admin Dashboard',
  staff: 'Staff Dashboard',
  org_officer: 'Organization Officer Dashboard',
  student: 'Student Dashboard',
  faculty: 'Faculty Dashboard',
}

const ROLE_ACTIONS = {
  admin: ['Manage users', 'Configure workflows', 'Review audit logs'],
  staff: ['Review submissions', 'Process approvals', 'Monitor notifications'],
  org_officer: ['Upload accreditation docs', 'Track organization requests', 'View approval status'],
  student: ['Submit clearance documents', 'Monitor request progress', 'Update profile details'],
  faculty: ['Endorse assigned documents', 'Check pending endorsements', 'Review workflow history'],
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { role: routeRole } = useParams()
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const actualRole = user?.role || null
  const roleMatchesRoute = actualRole && routeRole === actualRole

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
              <h1 className="text-3xl font-semibold mt-2">{ROLE_TITLES[actualRole] || 'Phase 2 Dashboard'}</h1>
              <p className="text-slate-300 mt-2">Role-based routing is active for authenticated sessions.</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition disabled:opacity-60"
            >
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>

          {!roleMatchesRoute && (
            <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-500/10 p-4 text-amber-100">
              <p className="font-medium">Role mismatch detected</p>
              <p className="mt-1 text-sm text-amber-200/90">
                You are signed in as <strong>{actualRole}</strong> but requested dashboard route <strong>{routeRole}</strong>.
              </p>
              <Link
                to={`/dashboard/${actualRole}`}
                className="inline-block mt-3 text-sm font-medium underline underline-offset-4"
              >
                Go to my dashboard
              </Link>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Name</p>
              <p className="text-lg mt-1">{user?.name || 'N/A'}</p>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Role</p>
              <p className="text-lg mt-1 capitalize">{user?.role || 'N/A'}</p>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 sm:col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
              <p className="text-lg mt-1 break-all">{user?.email || 'N/A'}</p>
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 sm:col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Role Quick Actions</p>
              <ul className="mt-2 text-sm text-slate-200 space-y-1">
                {(ROLE_ACTIONS[actualRole] || ['No role actions configured yet.']).map((action) => (
                  <li key={action}>- {action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
