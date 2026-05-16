import { STATUS_LABELS } from '../../utils/constants'

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  in_review: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  awaiting_info: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  archived: 'bg-slate-500/10 text-[var(--th-text-secondary)] border-slate-500/30',
}

/**
 * Color-coded pill badge for document status.
 */
export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  const label = STATUS_LABELS[status] || status

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
