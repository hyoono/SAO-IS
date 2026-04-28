import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import * as notificationsApi from '../../api/notifications'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/submit': 'Submit Document',
  '/my-submissions': 'My Submissions',
  '/approvals': 'Approvals Queue',
  '/notifications': 'Notifications',
  '/admin/users': 'User Management',
  '/workflows': 'Workflows',
  '/workflows/new': 'Create Workflow',
  '/admin/document-types': 'Document Types',
  '/audit-logs': 'Audit Log',
  '/admin/archive': 'Archive',
}

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Get unread notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then(r => r.data),
    refetchInterval: 30000, // Poll every 30 seconds
  })

  const unreadCount = Array.isArray(notificationsData?.data)
    ? notificationsData.data.filter(n => !n.is_read).length
    : 0

  // Determine page title from path
  const pathBase = '/' + location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
  const title = PAGE_TITLES[pathBase] || PAGE_TITLES['/' + location.pathname.split('/')[1]] || 'SAO-IS'

  return (
    <header className="h-16 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle} className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        {/* Page title */}
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.role || 'unknown'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
