import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor: fetch CSRF cookie before first mutating request
let csrfInitialized = false

api.interceptors.request.use(async (config) => {
  const mutatingMethods = ['post', 'put', 'patch', 'delete']
  if (mutatingMethods.includes(config.method) && !csrfInitialized) {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
    csrfInitialized = true
  }
  return config
})

// Interceptor: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthBootstrapRequest = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/login') || requestUrl.includes('/auth/logout')

    if (error.response?.status === 401 && !isAuthBootstrapRequest && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
