import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../../api/ai'

export default function LocalAiExtractor({ versionId, originalFilename, isOpen, onClose }) {
  const [expectedFields, setExpectedFields] = useState('')
  const [result, setResult] = useState(null)

  const mutation = useMutation({
    mutationFn: (data) => aiApi.extract(data),
    onSuccess: (res) => {
      setResult(res.data.extracted_data)
    },
    onError: (err) => {
      setResult({ error: err?.response?.data?.message || 'Failed to extract data. Is Ollama running?' })
    }
  })

  const handleExtract = () => {
    setResult(null)
    const fields = expectedFields.split(',').map(f => f.trim()).filter(Boolean)
    mutation.mutate({ version_id: versionId, expected_fields: fields.length > 0 ? fields : undefined })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--th-surface)] border border-[var(--th-border)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--th-border-subtle)] bg-[var(--th-surface-alt)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-lg font-semibold text-[var(--th-text)]">AI Data Extraction</h3>
          </div>
          <button onClick={onClose} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-sm text-[var(--th-text)] mb-2">Extracting data from: <span className="font-mono text-blue-500">{originalFilename}</span></p>
            <label className="block text-xs text-[var(--th-text-secondary)] mb-1">Expected Fields (Optional, comma-separated)</label>
            <input 
              type="text" 
              value={expectedFields} 
              onChange={e => setExpectedFields(e.target.value)} 
              placeholder="e.g. Student Name, ID Number, Date, Total Amount" 
              className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:ring-2 focus:ring-blue-500/40" 
            />
          </div>

          <button onClick={handleExtract} disabled={mutation.isPending} className="w-full px-4 py-2 text-sm font-medium text-[var(--th-btn-primary-text)] bg-[var(--th-btn-primary-bg)] hover:bg-[var(--th-btn-primary-hover)] border border-[var(--th-btn-primary-border)] rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
            {mutation.isPending ? 'Extracting with Local AI...' : 'Start Extraction'}
          </button>

          {result && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-[var(--th-text)] mb-2">Extraction Results:</h4>
              <div className="p-4 rounded-lg bg-[var(--th-surface-alt)] border border-[var(--th-border-subtle)] text-sm text-[var(--th-text)] whitespace-pre-wrap font-mono overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </div>
              <p className="text-[10px] text-[var(--th-text-faint)] mt-2 text-right">Processed securely on-device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
