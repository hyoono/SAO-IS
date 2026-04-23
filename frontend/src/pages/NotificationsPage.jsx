import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import * as notificationsApi from '../api/notifications'

function NotificationRow({ notification, onMarkRead, disabled }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-white">{notification.message || 'Notification'}</p>
      <p className="mt-1 text-xs text-slate-400">ID: {notification.id}</p>
      <p className="mt-1 text-xs text-slate-400">Status: {notification.is_read ? 'Read' : 'Unread'}</p>
      {!notification.is_read && (
        <button
          type="button"
          onClick={() => onMarkRead(notification.id)}
          disabled={disabled}
          className="mt-3 inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
        >
          Mark as read
        </button>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { role } = useAuth()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then((r) => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = Array.isArray(notificationsQuery.data?.data) ? notificationsQuery.data.data : []
  const hasUnread = items.some((item) => !item.is_read)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300/70">SAO-IS</p>
            <h1 className="text-3xl font-semibold mt-2">Notifications</h1>
            <p className="text-slate-300 mt-2">Review updates and mark alerts as read.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={!hasUnread || markAllReadMutation.isPending}
              className="inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              Mark all read
            </button>
            <Link
              to={`/dashboard/${role || 'student'}`}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-5">
          {notificationsQuery.isLoading && <p className="text-sm text-blue-200/80">Loading notifications...</p>}

          {notificationsQuery.isError && (
            <p className="text-sm text-amber-200/90">Unable to load notifications right now.</p>
          )}

          {!notificationsQuery.isLoading && !notificationsQuery.isError && items.length === 0 && (
            <p className="text-sm text-slate-300">No notifications yet.</p>
          )}

          {!notificationsQuery.isLoading && !notificationsQuery.isError && items.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  disabled={markReadMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
