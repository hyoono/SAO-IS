import { useQuery } from '@tanstack/react-query'
import * as workflowsApi from '../api/workflows'
import * as approvalsApi from '../api/approvals'

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.getWorkflows().then((r) => r.data),
  })
}

export function useWorkflow(id) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.getWorkflow(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['approvals', 'queue'],
    queryFn: () => approvalsApi.getQueue().then((r) => r.data),
  })
}

export function useApprovalHistory(documentId) {
  return useQuery({
    queryKey: ['approvals', 'history', documentId],
    queryFn: () => approvalsApi.getApprovalHistory(documentId).then((r) => r.data),
    enabled: !!documentId,
  })
}
