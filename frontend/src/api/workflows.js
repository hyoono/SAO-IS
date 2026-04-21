import api from './axios'

export const getWorkflows = () =>
  api.get('/workflows')

export const getWorkflow = (id) =>
  api.get(`/workflows/${id}`)

export const createWorkflow = (data) =>
  api.post('/workflows', data)

export const updateWorkflow = (id, data) =>
  api.put(`/workflows/${id}`, data)

export const getWorkflowSteps = (id) =>
  api.get(`/workflows/${id}/steps`)
