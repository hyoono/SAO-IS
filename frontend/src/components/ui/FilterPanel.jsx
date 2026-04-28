import { useState } from 'react'
import { DOCUMENT_STATUS, STATUS_LABELS } from '../../utils/constants'

/**
 * Collapsible filter panel for documents — type, status, and date range.
 */
export default function FilterPanel({ documentTypes = [], onFilter }) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const handleApply = () => {
    onFilter({ status, type, from, to })
  }

  const handleClear = () => {
    setStatus('')
    setType('')
    setFrom('')
    setTo('')
    onFilter({})
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Document Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">All types</option>
                {documentTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
            >
              Apply filters
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
