import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as notificationsApi from '../api/notifications'
import { formatDateTime } from '../utils/formatters'
import { Link } from 'react-router-dom'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then(r => r.data),
  })

  const items = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = items.filter(n => !n.is_read).length

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Notifications</h2>
          <p className="text-sm text-slate-400 mt-1">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="px-4 py-2 text-xs font-medium text-blue-200 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg cursor-pointer">
            Mark all read
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-blue-200/80 py-8 text-center">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div className="py-16 text-center"><p className="text-slate-400">No notifications.</p></div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`rounded-lg border p-4 flex items-start justify-between gap-4 transition-colors ${n.is_read ? 'border-white/5 bg-slate-950/30' : 'border-blue-500/20 bg-blue-500/5'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-slate-600' : 'bg-blue-400'}`} />
                <div>
                  <p className="text-sm text-white">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{formatDateTime(n.created_at)}</p>
                  {n.document_id && <Link to={`/documents/${n.document_id}`} className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 block">View document →</Link>}
                </div>
              </div>
              {!n.is_read && (
                <button onClick={() => markReadMutation.mutate(n.id)} className="text-[10px] text-slate-500 hover:text-white cursor-pointer flex-shrink-0">Mark read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
