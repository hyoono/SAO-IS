import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../../api/ai'

export default function BilingualAssistant({ initialText = '', compact = false }) {
  const [mode, setMode] = useState('tagalog')
  const [textContext, setTextContext] = useState(initialText)
  const [result, setResult] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => aiApi.translate(data),
    onSuccess: (res) => setResult(res.data.result),
    onError: (err) => setResult(`Error: ${err?.response?.data?.message || 'AI processing failed.'}`)
  })

  const handleProcess = () => {
    if (!textContext) return
    setResult('')
    mutation.mutate({ text: textContext, mode })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <select value={mode} onChange={e => setMode(e.target.value)} className="text-xs rounded border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-2 py-1 text-[var(--th-text)]">
          <option value="tagalog">Translate to Tagalog</option>
          <option value="plain_english">Simplify (Plain English)</option>
          <option value="summarize">Summarize</option>
        </select>
        <button onClick={handleProcess} disabled={mutation.isPending || !textContext} className="px-3 py-1 text-xs font-medium bg-[var(--th-badge-bg)] text-[var(--th-badge-text)] border border-[var(--th-badge-border)] rounded hover:opacity-80 disabled:opacity-50 flex items-center gap-1 cursor-pointer">
          {mutation.isPending ? 'Processing...' : 'Ask AI'}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--th-border)] bg-[var(--th-surface)] overflow-hidden flex flex-col">
      <div className="bg-blue-500/10 px-4 py-2 border-b border-[var(--th-border)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
          <span className="text-xs font-bold">AI Accessibility Assistant</span>
        </div>
        <div className="flex gap-2">
          <select value={mode} onChange={e => setMode(e.target.value)} className="text-[10px] rounded border border-[var(--th-border)] bg-[var(--th-surface)] px-2 py-1 text-[var(--th-text)]">
            <option value="tagalog">Tagalog Translation</option>
            <option value="plain_english">Plain English</option>
            <option value="summarize">Summary</option>
          </select>
          <button onClick={handleProcess} disabled={mutation.isPending || !textContext} className="px-2 py-1 text-[10px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 cursor-pointer">
            {mutation.isPending ? 'Working...' : 'Process Text'}
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <textarea
          value={textContext}
          onChange={(e) => setTextContext(e.target.value)}
          placeholder="Paste complex policy text or document excerpt here..."
          className="w-full text-sm rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] p-3 text-[var(--th-text)] focus:ring-2 focus:ring-blue-500/40 resize-none h-24"
        />
        {result && (
          <div className="p-4 rounded-lg bg-[var(--th-surface-alt)] border border-[var(--th-border-subtle)] text-sm text-[var(--th-text)] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {result}
          </div>
        )}
        {!result && !mutation.isPending && (
          <div className="text-xs text-[var(--th-text-muted)] italic text-center">
            Need help understanding a document? Paste the text above and click "Process Text" for an AI-generated explanation.
          </div>
        )}
      </div>
    </div>
  )
}
