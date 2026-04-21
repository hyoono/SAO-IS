import api from './axios'

export const getQueue = () =>
  api.get('/approvals/queue')

export const approve = (documentId, data) =>
  api.post(`/documents/${documentId}/approve`, data)

export const reject = (documentId, data) =>
  api.post(`/documents/${documentId}/reject`, data)

export const requestInfo = (documentId, data) =>
  api.post(`/documents/${documentId}/request-info`, data)

export const getApprovalHistory = (documentId) =>
  api.get(`/documents/${documentId}/history`)
