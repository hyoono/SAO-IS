import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import * as auditLogsApi from '../api/auditLogs'

function AuditLogRow({ log }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{log.action || 'audit_event'}</p>
      <p className="mt-1 text-xs text-slate-400">Created: {log.created_at || 'N/A'}</p>
      <p className="mt-1 text-xs text-slate-400">
        Actor: {log.user?.name || log.user?.email || 'System'}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Document: {log.document?.title || 'N/A'}
      </p>
      <pre className="mt-3 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-200">
        {JSON.stringify(log.details || {}, null, 2)}
      </pre>
    </div>
  )
}

export default function AuditLogsPage() {
  const { role } = useAuth()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogsApi.getAuditLogs().then((r) => r.data),
  })

  if (role !== 'admin') {
    return <Navigate to={`/dashboard/${role || 'student'}`} replace />
  }

  const logs = Array.isArray(data?.data) ? data.data : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Audit Logs</h1>
            <p className="text-slate-300 mt-2">Inspect recorded admin activity and document events.</p>
          </div>

          <Link
            to={`/dashboard/${role || 'admin'}`}
            className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          {isLoading && <p className="text-sm text-blue-200/80">Loading audit logs...</p>}

          {isError && (
            <p className="text-sm text-amber-200/90">
              Unable to load audit logs right now.
              {error?.response?.status ? ` (HTTP ${error.response.status})` : ''}
            </p>
          )}

          {!isLoading && !isError && logs.length === 0 && (
            <p className="text-sm text-slate-300">No audit logs found yet.</p>
          )}

          {!isLoading && !isError && logs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {logs.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
