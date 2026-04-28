import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import DocumentDetailPage from './pages/DocumentDetailPage.jsx'
import SubmitDocumentPage from './pages/SubmitDocumentPage.jsx'
import ApprovalsPage from './pages/ApprovalsPage.jsx'
import ApprovalDetailPage from './pages/ApprovalDetailPage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import AuditLogsPage from './pages/AuditLogsPage.jsx'
import WorkflowsPage from './pages/WorkflowsPage.jsx'
import WorkflowDetailPage from './pages/WorkflowDetailPage.jsx'
import WorkflowBuilderPage from './pages/WorkflowBuilderPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import DocumentTypesPage from './pages/DocumentTypesPage.jsx'
import { useAuth } from './hooks/useAuth'

function RoleHomeRedirect() {
  const { role, loading, isAuthenticated } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={`/dashboard/${role}`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated — inside AppShell */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<RoleHomeRedirect />} />
        <Route path="/dashboard/:role" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/submit" element={<SubmitDocumentPage />} />
        <Route path="/my-submissions" element={<DocumentsPage myOnly />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/new" element={<WorkflowBuilderPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/document-types" element={<DocumentTypesPage />} />
        <Route path="/admin/archive" element={<DocumentsPage archived />} />
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
