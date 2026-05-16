import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

/**
 * Application shell — persistent sidebar + topbar layout.
 * Sidebar collapses to a hamburger on small screens.
 */
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen relative">
      {/* Fixed background — avoids mobile repaint glitches */}
      <div className="fixed inset-0 -z-10 transition-colors duration-300" style={{ background: `linear-gradient(to bottom right, var(--th-bg-gradient-from), var(--th-bg-gradient-via), var(--th-bg-gradient-to))` }} />

      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
