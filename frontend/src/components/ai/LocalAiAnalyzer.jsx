import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../../api/ai'

export default function LocalAiAnalyzer({ isOpen, onClose, defaultFocus = '' }) {
  const [dataPayload, setDataPayload] = useState('')
  const [focusArea, setFocusArea] = useState(defaultFocus)
  const [result, setResult] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => aiApi.analyze(data),
    onSuccess: (res) => {
      setResult(res.data.analysis)
    },
    onError: (err) => {
      setResult(`Error: ${err?.response?.data?.message || 'Failed to analyze data.'}`)
    }
  })

  const handleAnalyze = () => {
    setResult('')
    mutation.mutate({ data_payload: dataPayload, focus_area: focusArea })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--th-surface)] border border-[var(--th-border)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--th-border-subtle)] bg-[var(--th-surface-alt)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <h3 className="text-lg font-semibold text-[var(--th-text)]">Data Analysis Engine</h3>
          </div>
          <button onClick={onClose} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Focus Area (Optional)</label>
              <input 
                type="text" 
                value={focusArea} 
                onChange={e => setFocusArea(e.target.value)} 
                placeholder="e.g. Budget utilization, Event attendance trends" 
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:ring-2 focus:ring-blue-500/40" 
              />
            </div>
            
            <div>
              <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Data Payload (Paste CSV, JSON, or tabular data here)</label>
              <textarea 
                value={dataPayload} 
                onChange={e => setDataPayload(e.target.value)} 
                placeholder="Paste the raw data to be analyzed..." 
                rows={6}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:ring-2 focus:ring-blue-500/40 font-mono" 
              />
            </div>

            <button onClick={handleAnalyze} disabled={mutation.isPending || !dataPayload.trim()} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {mutation.isPending ? 'Analyzing Data...' : 'Generate Executive Summary'}
            </button>
          </div>

          {result && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-[var(--th-text)] mb-2">Executive Summary:</h4>
              <div className="p-4 rounded-lg bg-[var(--th-surface-alt)] border border-[var(--th-border-subtle)] text-sm text-[var(--th-text)] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
