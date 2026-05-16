/**
 * Generic confirmation modal for destructive or important actions.
 */
export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-[var(--th-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-[var(--th-text-secondary)] mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--th-text-secondary)] bg-[var(--th-surface)] hover:bg-[var(--th-surface-hover)] border border-[var(--th-border)] rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all cursor-pointer ${
              danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
