import { useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as notificationsApi from '../api/notifications'
import { formatDateTime } from '../utils/formatters'
import { Link } from 'react-router-dom'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const hasAutoMarked = useRef(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then(r => r.data),
  })

  const items = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])
  const unread = items.filter(n => !n.is_read).length

  // Auto-mark all as read when page opens with unread notifications
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!isLoading && unread > 0 && !hasAutoMarked.current) {
      hasAutoMarked.current = true
      markAllMutation.mutate()
    }
  }, [isLoading, unread])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--th-text)]">Notifications</h2>
        <p className="text-sm text-[var(--th-text-secondary)] mt-1">{items.length} notification{items.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div className="py-16 text-center"><p className="text-[var(--th-text-secondary)]">No notifications.</p></div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="rounded-lg border border-[var(--th-border-subtle)] bg-[var(--th-surface)] p-4 flex items-start gap-3 transition-colors">
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-slate-600" />
              <div>
                <p className="text-sm text-[var(--th-text)]">{n.message}</p>
                <p className="text-[10px] text-[var(--th-text-muted)] mt-1">{formatDateTime(n.created_at)}</p>
                {n.document_id && <Link to={`/documents/${n.document_id}`} className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 block">View document →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
