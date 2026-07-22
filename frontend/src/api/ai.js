import api from './axios'

export const draft = (data) => api.post('/ai/draft', data)

export const extract = (data) => api.post('/ai/extract', data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

export const analyze = (data) => api.post('/ai/analyze', data)

export const translate = (data) => api.post('/ai/translate', data)

export const chat = (data) => api.post('/ai/chat', data)

export const suggestWorkflow = (data) => api.post('/ai/suggest-workflow', data)

export const classifyDocument = (data) => api.post('/ai/classify-document', data)

export const verifyDocument = (data) => api.post('/ai/verify-document', data)

export const recommendApproval = (data) => api.post('/ai/recommend-approval', data)

export const parseSearch = (data) => api.post('/ai/parse-search', data)

export const getAnomalies = () => api.get('/ai/anomalies')

export const getAnalytics = () => api.get('/ai/analytics')

export const generateReport = () => api.post('/ai/generate-report')
