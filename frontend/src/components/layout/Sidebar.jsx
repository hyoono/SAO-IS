import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon, roles: null },
  { label: 'Documents', to: '/documents', icon: DocIcon, roles: null },
  { label: 'Submit', to: '/submit', icon: PlusIcon, roles: ['student', 'org_officer', 'faculty', 'admin', 'staff', 'director', 'center_head'] },
  { label: 'My Submissions', to: '/my-submissions', icon: FolderIcon, roles: ['student', 'org_officer', 'faculty'] },
  { label: 'Approvals', to: '/approvals', icon: CheckIcon, roles: ['admin', 'staff', 'faculty', 'director', 'center_head'] },
  { label: 'Notifications', to: '/notifications', icon: BellIcon, roles: null },
  // Admin group
  { label: 'Users', to: '/admin/users', icon: UsersIcon, roles: ['admin', 'director'] },
  { label: 'Centers', to: '/admin/centers', icon: TypeIcon, roles: ['admin', 'director'] },
  { label: 'Workflows', to: '/workflows', icon: FlowIcon, roles: ['admin', 'staff', 'director', 'center_head'] },
  { label: 'Document Types', to: '/admin/document-types', icon: TypeIcon, roles: ['admin', 'staff', 'director', 'center_head'] },
  { label: 'Reports', to: '/reports', icon: DocIcon, roles: ['admin', 'director', 'center_head', 'staff'] },
  { label: 'Audit Log', to: '/audit-logs', icon: LogIcon, roles: ['admin', 'director'] },
  { label: 'Archive', to: '/admin/archive', icon: ArchiveIcon, roles: ['admin', 'staff', 'director'] },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { role } = useAuth()

  const filteredItems = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

  const mainItems = filteredItems.filter(i => ['/dashboard', '/documents', '/submit', '/my-submissions', '/notifications'].includes(i.to))
  const workflowItems = filteredItems.filter(i => ['/approvals'].includes(i.to))
  const adminItems = filteredItems.filter(i => ['/admin/users', '/admin/centers', '/workflows', '/admin/document-types', '/reports', '/audit-logs', '/admin/archive'].includes(i.to))

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-64 backdrop-blur-xl border-r flex flex-col z-40 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{ backgroundColor: 'var(--th-sidebar-bg)', borderColor: 'var(--th-border-subtle)' }}>
      {/* Logo + close on mobile */}
      <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: 'var(--th-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--th-text)' }}>SAO-IS</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--th-text-muted)' }}>Student Affairs</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 cursor-pointer" style={{ color: 'var(--th-text-muted)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" onClick={onClose}>
        <NavGroup label="Main" items={mainItems} />
        {workflowItems.length > 0 && <NavGroup label="Workflow" items={workflowItems} />}
        {adminItems.length > 0 && <NavGroup label="Administration" items={adminItems} />}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--th-border-subtle)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--th-text-faint)' }}>MMCL · SAO-IS v1.0</p>
      </div>
    </aside>
  )
}

function NavGroup({ label, items }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--th-text-muted)' }}>{label}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
              isActive
                ? 'text-[var(--th-link)]'
                : 'border-transparent'
            }`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? 'var(--th-sidebar-active)' : 'transparent',
            borderColor: isActive ? 'var(--th-badge-border)' : 'transparent',
            color: isActive ? undefined : 'var(--th-text-secondary)',
          })}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

// ── Inline SVG Icons ──

function HomeIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function DocIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function PlusIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function FolderIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BellIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function FlowIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function TypeIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

function LogIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function ArchiveIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  )
}
