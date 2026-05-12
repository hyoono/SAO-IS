import api from './axios'

export const getReports = (params) => api.get('/reports', { params })

export const uploadReport = (formData) =>
  api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const downloadReport = (id) =>
  api.get(`/reports/${id}/download`, { responseType: 'blob' })
