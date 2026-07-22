import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../../api/ai'

export default function LocalAiDrafter({ isOpen, onClose }) {
  const [topic, setTopic] = useState('')
  const [type, setType] = useState('memo')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [draft, setDraft] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => aiApi.draft(data),
    onSuccess: (res) => {
      setDraft(res.data.draft)
    },
    onError: (err) => {
      setDraft(`Error: ${err?.response?.data?.message || 'Failed to generate draft. Is Ollama running?'}`)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setDraft('')
    mutation.mutate({ topic, type, additional_instructions: additionalInstructions })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(draft)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pb-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--th-surface)] border border-[var(--th-border)] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 5rem)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--th-border-subtle)] bg-[var(--th-surface-alt)] rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-[var(--th-text)]">Local AI Content Drafter</h3>
          </div>
          <button onClick={onClose} className="text-[var(--th-text-muted)] hover:text-[var(--th-text)] cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Document Type */}
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-secondary)] mb-1.5">Document Type</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option value="memo">Memo</option>
                <option value="letter">Letter</option>
                <option value="certificate">Certificate Text</option>
                <option value="announcement">Announcement</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-secondary)] mb-1.5">Topic / Subject</label>
              <input
                type="text"
                required
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Foundation Day Clearance Reminder"
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Additional instructions */}
            <div>
              <label className="block text-xs font-medium text-[var(--th-text-secondary)] mb-1.5">Additional Instructions <span className="text-[var(--th-text-muted)] font-normal">(Optional)</span></label>
              <textarea
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                rows={2}
                placeholder="e.g. Keep it strictly formal and mention the deadline is Friday."
                className="w-full rounded-lg border border-[var(--th-border)] bg-[var(--th-surface-alt)] px-3 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            <button type="submit" disabled={mutation.isPending || !topic}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Drafting with Local AI…
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Generate Draft
                </>
              )}
            </button>
          </form>

          {draft && (
            <div className="border-t border-[var(--th-border-subtle)] pt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[var(--th-text)]">Generated Draft</h4>
                <button onClick={handleCopy} className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                  Copy Text
                </button>
              </div>
              <div className="p-4 rounded-lg bg-[var(--th-surface-alt)] border border-[var(--th-border-subtle)] text-sm text-[var(--th-text)] whitespace-pre-wrap leading-relaxed">
                {draft}
              </div>
              <p className="text-[10px] text-[var(--th-text-faint)] mt-2 text-right">Generated securely on-device via Ollama.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SparklesIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
