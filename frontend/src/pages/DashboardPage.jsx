import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import * as aiApi from '../api/ai'

export default function DashboardPage() {
  const { role: paramRole } = useParams()
  const { user, role } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary').then(r => r.data),
  })

  const anomaliesQuery = useQuery({
    queryKey: ['dashboard', 'ai-anomalies'],
    queryFn: () => aiApi.getAnomalies().then(r => r.data),
    enabled: ['admin', 'director'].includes(role),
  })

  const analyticsQuery = useQuery({
    queryKey: ['dashboard', 'ai-analytics'],
    queryFn: () => aiApi.getAnalytics().then(r => r.data),
    enabled: ['admin', 'director', 'center_head'].includes(role),
  })

  const modules = useMemo(() => Array.isArray(data?.modules) ? data.modules : [], [data])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Welcome, {user?.name || 'User'}</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1 capitalize">{role} Dashboard</p>
      </div>

      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading dashboard…</p>}

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

      {/* AI Anomalies & Analytics */}
      {['admin', 'director', 'center_head'].includes(role) && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--th-text-secondary)] flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AI Analytics & Insights
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Predictive Analytics */}
            <div className="p-4 rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full"></div>
              <h4 className="text-xs font-semibold text-[var(--th-text-muted)] uppercase tracking-wider mb-2">Predictive Workload</h4>
              {analyticsQuery.isLoading ? (
                <p className="text-sm text-[var(--th-text-muted)]">Analyzing backlog...</p>
              ) : (
                <p className="text-sm text-[var(--th-text)]">{analyticsQuery.data?.predictive || 'No predictive insights available.'}</p>
              )}
            </div>

            {/* Journey Analytics */}
            <div className="p-4 rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full"></div>
              <h4 className="text-xs font-semibold text-[var(--th-text-muted)] uppercase tracking-wider mb-2">Workflow Journey</h4>
              {analyticsQuery.isLoading ? (
                <p className="text-sm text-[var(--th-text-muted)]">Analyzing workflows...</p>
              ) : (
                <p className="text-sm text-[var(--th-text)]">{analyticsQuery.data?.journey || 'No journey insights available.'}</p>
              )}
            </div>
          </div>

          {/* Anomalies */}
          {['admin', 'director'].includes(role) && (
            <div>
              {anomaliesQuery.isLoading ? (
                <p className="text-xs text-[var(--th-text-muted)] mt-2">Loading anomalies...</p>
              ) : anomaliesQuery.data && anomaliesQuery.data.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {anomaliesQuery.data.map((anomaly, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-[var(--th-text)] flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">⚠️</span>
                      <span>{anomaly}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 mt-2 rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] text-sm text-[var(--th-text-secondary)]">
                  No anomalies detected in the past 7 days.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--th-text-secondary)] mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/documents" className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] border border-[var(--th-border)] rounded-lg">View Documents</Link>
          {['student', 'org_officer', 'faculty', 'admin', 'staff', 'director', 'center_head'].includes(role) && (
            <Link to="/submit" className="px-4 py-2 text-xs font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] hover:bg-[var(--th-btn-primary-hover)] border border-[var(--th-btn-primary-border)] rounded-lg">Submit Document</Link>
          )}
          {['admin', 'staff', 'faculty', 'director', 'center_head'].includes(role) && (
            <Link to="/approvals" className="px-4 py-2 text-xs font-medium text-[var(--th-btn-success-text)] bg-[var(--th-btn-success-bg)] hover:bg-[var(--th-btn-success-hover)] border border-[var(--th-btn-success-border)] rounded-lg">Review Queue</Link>
          )}
          <Link to="/notifications" className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] border border-[var(--th-border)] rounded-lg">Notifications</Link>
        </div>
      </div>
    </div>
  )
}
