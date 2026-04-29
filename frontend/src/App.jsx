import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import RoleGuard from './components/layout/RoleGuard.jsx'
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
import WorkflowEditPage from './pages/WorkflowEditPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import DocumentTypesPage from './pages/DocumentTypesPage.jsx'
import ForbiddenPage from './pages/ForbiddenPage.jsx'
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
        {/* General — all authenticated users */}
        <Route path="/dashboard" element={<RoleHomeRedirect />} />
        <Route path="/dashboard/:role" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/submit" element={<SubmitDocumentPage />} />
        <Route path="/my-submissions" element={<DocumentsPage myOnly />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Approvals — admin, staff, faculty */}
        <Route path="/approvals" element={<RoleGuard allowed={['admin', 'staff', 'faculty']} fallback={<ForbiddenPage />}><ApprovalsPage /></RoleGuard>} />
        <Route path="/approvals/:id" element={<RoleGuard allowed={['admin', 'staff', 'faculty']} fallback={<ForbiddenPage />}><ApprovalDetailPage /></RoleGuard>} />

        {/* Workflows — admin, staff */}
        <Route path="/workflows" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><WorkflowsPage /></RoleGuard>} />
        <Route path="/workflows/new" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><WorkflowBuilderPage /></RoleGuard>} />
        <Route path="/workflows/:id/edit" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><WorkflowEditPage /></RoleGuard>} />
        <Route path="/workflows/:id" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><WorkflowDetailPage /></RoleGuard>} />

        {/* Admin only */}
        <Route path="/admin/users" element={<RoleGuard allowed={['admin']} fallback={<ForbiddenPage />}><UsersPage /></RoleGuard>} />
        <Route path="/audit-logs" element={<RoleGuard allowed={['admin']} fallback={<ForbiddenPage />}><AuditLogsPage /></RoleGuard>} />

        {/* Admin + staff */}
        <Route path="/admin/document-types" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><DocumentTypesPage /></RoleGuard>} />
        <Route path="/admin/archive" element={<RoleGuard allowed={['admin', 'staff']} fallback={<ForbiddenPage />}><DocumentsPage archived /></RoleGuard>} />
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
