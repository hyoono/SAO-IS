import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const logout = () =>
  api.post('/auth/logout')

export const getMe = () =>
  api.get('/auth/me')

export const ms365Redirect = () =>
  api.get('/auth/ms365/redirect')
