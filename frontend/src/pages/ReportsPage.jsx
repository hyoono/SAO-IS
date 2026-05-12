import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import * as reportsApi from '../api/reports'
import * as centersApi from '../api/centers'
import { formatDateTime, formatFileSize } from '../utils/formatters'

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const { role, user } = useAuth()
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', center_id: '', report_date: '' })
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [centerFilter, setCenterFilter] = useState('')

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
          <h2 className="text-2xl font-semibold text-white">Reports</h2>
          <p className="text-sm text-slate-400 mt-1">Center-generated reports and data files.</p>
        </div>
        <button onClick={() => { setShowUpload(true); setMsg('') }}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
          + Upload Report
        </button>
      </div>

      {msg && <p className="text-xs text-emerald-300">{msg}</p>}

      {/* Center Filter */}
      {['admin', 'director'].includes(role) && centers.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filter:</span>
          <button onClick={() => setCenterFilter('')}
            className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${!centerFilter ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            All
          </button>
          {centers.map((c) => (
            <button key={c.id} onClick={() => setCenterFilter(c.id)}
              className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${centerFilter === c.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              {c.code}
            </button>
          ))}
        </div>
      )}

      {/* Upload Form */}
      {showUpload && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Upload Report</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Report title" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Center</label>
              <select value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
              <label className="block text-xs text-slate-400 mb-1">Report Date (optional)</label>
              <input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">File</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-slate-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-500/10 file:text-blue-300 file:cursor-pointer"
                required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={uploadMutation.isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg cursor-pointer">
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reports Table */}
      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && reports.length === 0 && (
        <div className="py-16 text-center"><p className="text-slate-400">No reports uploaded yet.</p></div>
      )}

      {reports.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Center</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {r.center?.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {r.original_filename} <span className="text-slate-600">({formatFileSize(r.file_size)})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.report_date || formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.uploader?.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDownload(r)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">Download</button>
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
