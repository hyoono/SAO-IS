import api from './axios'

export const getAuditLogs = () =>
  api.get('/audit-logs')
