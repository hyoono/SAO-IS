import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
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
  '/admin/centers': 'Centers',
  '/workflows': 'Workflows',
  '/workflows/new': 'Create Workflow',
  '/admin/document-types': 'Document Types',
  '/reports': 'Reports',
  '/audit-logs': 'Audit Log',
  '/admin/archive': 'Archive',
}

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications().then(r => r.data),
    refetchInterval: 30000,
  })

  const unreadCount = Array.isArray(notificationsData?.data)
    ? notificationsData.data.filter(n => !n.is_read).length
    : 0

  const pathBase = '/' + location.pathname.split('/').filter(Boolean).slice(0, 2).join('/')
  const title = PAGE_TITLES[pathBase] || PAGE_TITLES['/' + location.pathname.split('/')[1]] || 'SAO-IS'

  return (
    <header className="h-16 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30"
      style={{ backgroundColor: 'var(--th-surface)', borderColor: 'var(--th-border-subtle)' }}>
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--th-text-secondary)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--th-text)' }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme toggle */}
        <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-lg transition-all cursor-pointer"
          style={{ color: 'var(--th-text-secondary)' }}>
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notification bell */}
        <Link to="/notifications" className="relative p-2 rounded-lg transition-all"
          style={{ color: 'var(--th-text-secondary)' }}>
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
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium" style={{ color: 'var(--th-text)' }}>{user?.name || 'User'}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>{user?.role || 'unknown'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <button onClick={logout} className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer" title="Logout">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
