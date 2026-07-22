import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import * as reportsApi from '../api/reports'
import * as centersApi from '../api/centers'
import * as aiApi from '../api/ai'
import LocalAiAnalyzer from '../components/ai/LocalAiAnalyzer'
import { formatDateTime, formatFileSize } from '../utils/formatters'

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const { role, user } = useAuth()
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', center_id: '', report_date: '' })
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [analyzerState, setAnalyzerState] = useState({ isOpen: false, defaultFocus: '' })
  const [weeklyReport, setWeeklyReport] = useState('')

  const generateReportMutation = useMutation({
    mutationFn: () => aiApi.generateReport(),
    onSuccess: (res) => {
      setWeeklyReport(res.data.markdown)
    },
    onError: () => setMsg('Failed to generate weekly report.')
  })

  const { data, isLoading } = useQuery({
    queryKey: ['reports', centerFilter],
    queryFn: () => reportsApi.getReports(centerFilter ? { center_id: centerFilter } : {}).then(r => r.data),
  })

  const { data: centersData } = useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.getCenters().then(r => r.data),
  })

  const reports = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])
  const centers = useMemo(() => Array.isArray(centersData) ? centersData : [], [centersData])

  const uploadMutation = useMutation({
    mutationFn: (formData) => reportsApi.uploadReport(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setShowUpload(false)
      setForm({ title: '', center_id: '', report_date: '' })
      setFile(null)
      setMsg('Report uploaded.')
    },
    onError: (e) => setMsg(e?.response?.data?.message || 'Upload failed.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('center_id', form.center_id || user?.center_id || '')
    fd.append('file', file)
    if (form.report_date) fd.append('report_date', form.report_date)
    uploadMutation.mutate(fd)
  }

  const handleDownload = async (report) => {
    try {
      const res = await reportsApi.downloadReport(report.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = report.original_filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setMsg('Download failed.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--th-text)]">Reports</h2>
          <p className="text-sm text-[var(--th-text-secondary)] mt-1">Center-generated reports and data files.</p>
        </div>
        <div className="flex items-center gap-3">
          {['admin', 'director'].includes(role) && (
            <button onClick={() => generateReportMutation.mutate()} disabled={generateReportMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg cursor-pointer flex items-center gap-2 border border-purple-500/20 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              {generateReportMutation.isPending ? 'Generating...' : 'AI Weekly Report'}
            </button>
          )}
          {['admin', 'director', 'center_head', 'staff'].includes(role) && (
            <button onClick={() => setAnalyzerState({ isOpen: true, defaultFocus: '' })}
              className="px-4 py-2 text-xs font-medium text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg cursor-pointer flex items-center gap-2 border border-blue-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Analyze Data
            </button>
          )}
          <button onClick={() => { setShowUpload(true); setMsg('') }}
            className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
            + Upload Report
          </button>
        </div>
      </div>

      {msg && <p className="text-xs text-[var(--th-btn-success-text)]">{msg}</p>}

      {/* AI Weekly Report display */}
      {weeklyReport && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 relative">
          <button onClick={() => setWeeklyReport('')} className="absolute top-4 right-4 text-[var(--th-text-muted)] hover:text-[var(--th-text)] cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h3 className="text-sm font-semibold text-[var(--th-text)] mb-3 flex items-center gap-2">
            ✨ AI-Generated Weekly Report
          </h3>
          <div className="text-sm text-[var(--th-text-secondary)] whitespace-pre-wrap font-sans">
            {weeklyReport}
          </div>
        </div>
      )}

      {/* Center Filter */}
      {['admin', 'director'].includes(role) && centers.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--th-text-secondary)]">Filter:</span>
          <button onClick={() => setCenterFilter('')}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${!centerFilter ? 'bg-blue-600 text-[var(--th-text)]' : 'bg-[var(--th-surface)] text-[var(--th-text-secondary)] hover:text-[var(--th-text)]'}`}>
            All
          </button>
          {centers.map((c) => (
            <button key={c.id} onClick={() => setCenterFilter(c.id)}
              className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${centerFilter === c.id ? 'bg-blue-600 text-[var(--th-text)]' : 'bg-[var(--th-surface)] text-[var(--th-text-secondary)] hover:text-[var(--th-text)]'}`}>
              {c.code}
            </button>
          ))}
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--th-text)]">Upload Report</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Report title" required />
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Center</label>
              <select value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                required>
                <option value="">Select center…</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Report Date (optional)</label>
              <input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">File</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-[var(--th-text-secondary)] file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--th-btn-primary-bg)] file:text-[var(--th-btn-primary-text)] file:cursor-pointer"
                required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={uploadMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-[var(--th-text)] bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-xs text-[var(--th-text-secondary)] hover:text-[var(--th-text)] cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reports Table */}
      {isLoading && <p className="text-sm text-[var(--th-loading-text)] py-8 text-center">Loading…</p>}

      {!isLoading && reports.length === 0 && (
        <div className="py-16 text-center"><p className="text-[var(--th-text-secondary)]">No reports uploaded yet.</p></div>
      )}

      {reports.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--th-border)]">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--th-surface-alt)] text-[var(--th-text-secondary)] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Center</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--th-border-subtle)]">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--th-surface-hover)] transition-colors">
                  <td className="px-4 py-3 text-[var(--th-text)]">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--th-badge-bg)] text-[var(--th-badge-text)] border border-[var(--th-badge-border)]">
                      {r.center?.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">
                    {r.original_filename} <span className="text-[var(--th-text-faint)]">({formatFileSize(r.file_size)})</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{r.report_date || formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3 text-[var(--th-text-secondary)] text-xs">{r.uploader?.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {['admin', 'director', 'center_head', 'staff'].includes(role) && (
                        <button onClick={() => setAnalyzerState({ isOpen: true, defaultFocus: r.title })}
                          className="text-xs text-blue-400 hover:text-blue-500 cursor-pointer">
                          Analyze
                        </button>
                      )}
                      <button onClick={() => handleDownload(r)} className="text-xs text-[var(--th-link)] hover:text-[var(--th-link-hover)] cursor-pointer">Download</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Analyzer Modal */}
      <LocalAiAnalyzer 
        isOpen={analyzerState.isOpen} 
        onClose={() => setAnalyzerState({ isOpen: false, defaultFocus: '' })} 
        defaultFocus={analyzerState.defaultFocus} 
      />
    </div>
  )
}
