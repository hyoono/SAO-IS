import api from './axios'

export const getDocuments = (params) =>
  api.get('/documents', { params })

export const getDocument = (id) =>
  api.get(`/documents/${id}`)

export const submitDocument = (data) =>
  api.post('/documents', data)

export const searchDocuments = (query) =>
  api.get('/documents/search', { params: { q: query } })

export const getVersions = (documentId) =>
  api.get(`/documents/${documentId}/versions`)

export const uploadVersion = (documentId, formData) =>
  api.post(`/documents/${documentId}/versions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const downloadVersion = (documentId, versionId) =>
  api.get(`/documents/${documentId}/versions/${versionId}/download`, {
    responseType: 'blob',
  })

export const archiveDocument = (documentId) =>
  api.patch(`/documents/${documentId}/archive`)
