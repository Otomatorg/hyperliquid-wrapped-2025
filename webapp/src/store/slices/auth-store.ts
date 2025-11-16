import { setAxiosAuthorization } from '@/lib/axios'
import { StateCreator } from 'zustand'

export interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  isLoading: boolean
  error: string | null
}

export interface AuthActions {
  authenticate: (token: string) => void
  signOut: () => void
  refreshAccessToken: (accessToken: string, expiresAt: number) => void
  isTokenExpired: () => boolean
  validateAndRestoreSession: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export type AuthSlice = AuthState & AuthActions

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isLoading: false,
  error: null,
}

const TOKEN_STORAGE_KEY = 'auth_token'
const EXPIRES_AT_STORAGE_KEY = 'auth_expires_at'

const decodeJWTAndCheckValidity = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = JSON.parse(atob(base64))

    const exp = jsonPayload.exp * 1000
    return exp
  } catch (error) {
    console.log('Failed to decode token', error)
    return null
  }
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  ...initialState,

  authenticate: (token) => {
    try {
      const expiresAt = decodeJWTAndCheckValidity(token)

      if (!expiresAt || Date.now() >= expiresAt) {
        throw new Error('Token is already expired')
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(EXPIRES_AT_STORAGE_KEY, expiresAt.toString())

      set({
        isAuthenticated: true,
        accessToken: token,
        refreshToken: token,
        expiresAt,
        isLoading: false,
        error: null,
      })
      setAxiosAuthorization(token)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login'
      set({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        isLoading: false,
        error: errorMessage,
      })
    }
  },
  signOut: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(EXPIRES_AT_STORAGE_KEY)

    setAxiosAuthorization(null)
    set(initialState)
  },
  refreshAccessToken: (accessToken) => {
    try {
      const expiresAt = decodeJWTAndCheckValidity(accessToken)

      if (!expiresAt || Date.now() >= expiresAt) {
        throw new Error('New token is already expired')
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
      localStorage.setItem(EXPIRES_AT_STORAGE_KEY, expiresAt.toString())

      set({
        accessToken,
        expiresAt,
        error: null,
      })
      setAxiosAuthorization(accessToken)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh token'
      set({ error: errorMessage })
    }
  },
  isTokenExpired: () => {
    const { expiresAt } = get()
    if (!expiresAt) return true

    const isExpired = Date.now() >= expiresAt
    if (isExpired) {
      console.log('Token has expired')
    }
    return isExpired
  },
  validateAndRestoreSession: () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      const expiresAtStr = localStorage.getItem(EXPIRES_AT_STORAGE_KEY)

      if (!token || !expiresAtStr) {
        return
      }

      const expiresAt = parseInt(expiresAtStr, 10)

      if (Date.now() >= expiresAt) {
        console.log('Stored token is expired - clearing session')
        get().signOut()
        return
      }

      set({
        isAuthenticated: true,
        accessToken: token,
        refreshToken: token,
        expiresAt,
        isLoading: false,
        error: null,
      })

      setAxiosAuthorization(token)
    } catch (error) {
      console.log('Failed to restore session:', error)
      get().signOut()
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
})
