import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import WorkflowsPage from './pages/WorkflowsPage.jsx'
import WorkflowDetailPage from './pages/WorkflowDetailPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import DocumentDetailPage from './pages/DocumentDetailPage.jsx'
import ApprovalsPage from './pages/ApprovalsPage.jsx'
import ApprovalDetailPage from './pages/ApprovalDetailPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import AuditLogsPage from './pages/AuditLogsPage.jsx'
import { useAuth } from './hooks/useAuth'

function RoleHomeRedirect() {
  const { role, loading, isAuthenticated } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/dashboard/${role}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/:role"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/workflows"
        element={(
          <ProtectedRoute>
            <WorkflowsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/workflows/:id"
        element={(
          <ProtectedRoute>
            <WorkflowDetailPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/documents"
        element={(
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/documents/:id"
        element={(
          <ProtectedRoute>
            <DocumentDetailPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/approvals"
        element={(
          <ProtectedRoute>
            <ApprovalsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/approvals/:id"
        element={(
          <ProtectedRoute>
            <ApprovalDetailPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/notifications"
        element={(
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/audit-logs"
        element={(
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
