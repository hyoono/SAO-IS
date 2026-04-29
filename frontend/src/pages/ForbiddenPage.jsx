import { Link } from 'react-router-dom'

/**
 * Full-screen 403 Forbidden error page.
 * Shown when a user navigates to a page they don't have access to.
 */
export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">403</h2>
      <p className="text-lg text-slate-300 mb-1">Access Forbidden</p>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        You don't have permission to access this page. Contact your administrator if you believe this is an error.
      </p>
      <Link to="/dashboard"
        className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors">
        Back to Dashboard
      </Link>
    </div>
  )
}
