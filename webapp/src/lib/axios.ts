import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL

export const api = axios.create({
  baseURL,
  timeout: 30000, // 30s
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.response.use(
  function (response) {
    return response
  },

  async function (error) {
    const {
      response: { status },
    } = error

    if (status === 403) {
      window.location.href = '/403'
    }
    return Promise.reject(error)
  },
)

// Initialize with token from localStorage if available
const initializeAuthToken = () => {
  const token = localStorage.getItem('auth_token')
  const expiresAt = localStorage.getItem('auth_expires_at')

  if (token && expiresAt) {
    const isExpired = Date.now() >= parseInt(expiresAt, 10)
    if (!isExpired) {
      api.defaults.headers.common['Authorization'] = token
      return true
    } else {
      // Clear expired token
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_expires_at')
    }
  }

  // No valid token found
  delete api.defaults.headers.common['Authorization']
  return false
}

if (typeof window !== 'undefined') {
  initializeAuthToken()
}

export const setAxiosAuthorization = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = token
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Helper to check if we have a valid token
export const hasValidToken = () => {
  const token = localStorage.getItem('auth_token')
  const expiresAt = localStorage.getItem('auth_expires_at')

  if (!token || !expiresAt) return false

  return Date.now() < parseInt(expiresAt, 10)
}
