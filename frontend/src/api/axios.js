import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

/**
 * CSRF token management for Sanctum SPA auth.
 *
 * We check if the XSRF-TOKEN cookie exists before mutating requests.
 * If it's missing (first request or after session expiry), we fetch it.
 * This avoids hammering /sanctum/csrf-cookie on every single POST.
 */
function hasXsrfCookie() {
  return document.cookie.split(';').some(c => c.trim().startsWith('XSRF-TOKEN='))
}

let csrfPromise = null

api.interceptors.request.use(async (config) => {
  const mutatingMethods = ['post', 'put', 'patch', 'delete']
  if (mutatingMethods.includes(config.method) && !hasXsrfCookie()) {
    // Deduplicate concurrent CSRF fetches
    if (!csrfPromise) {
      csrfPromise = axios.get('/sanctum/csrf-cookie', { withCredentials: true })
        .finally(() => { csrfPromise = null })
    }
    await csrfPromise
  }
  return config
})

// Interceptor: redirect to login on 401 (session expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthRequest = requestUrl.includes('/auth/me')
      || requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/logout')

    if (error.response?.status === 401 && !isAuthRequest && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
