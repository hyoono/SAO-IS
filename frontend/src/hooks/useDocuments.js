import { useQuery } from '@tanstack/react-query'
import * as documentsApi from '../api/documents'

export function useDocuments(params) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getDocuments(params).then((r) => r.data),
  })
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getDocument(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useDocumentSearch(query) {
  return useQuery({
    queryKey: ['documents', 'search', query],
    queryFn: () => documentsApi.searchDocuments(query).then((r) => r.data),
    enabled: !!query,
  })
}

export function useDocumentVersions(documentId) {
  return useQuery({
    queryKey: ['document', documentId, 'versions'],
    queryFn: () => documentsApi.getVersions(documentId).then((r) => r.data),
    enabled: !!documentId,
  })
}
