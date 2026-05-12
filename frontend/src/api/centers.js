import api from './axios'

export const getCenters = () => api.get('/centers')
export const createCenter = (data) => api.post('/centers', data)
export const updateCenter = (id, data) => api.patch(`/centers/${id}`, data)
export const getCenterStats = (id) => api.get(`/centers/${id}/stats`)
