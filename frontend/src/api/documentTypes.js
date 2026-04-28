import api from './axios'

export const getDocumentTypes = () =>
  api.get('/document-types')

export const createDocumentType = (data) =>
  api.post('/document-types', data)

export const updateDocumentType = (id, data) =>
  api.patch(`/document-types/${id}`, data)
