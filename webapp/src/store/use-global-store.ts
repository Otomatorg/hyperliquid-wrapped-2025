import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { AuthSlice, createAuthSlice } from './slices/auth-store'
import { ThemeSlice, createThemeSlice } from './slices/theme-store'
import { UserSlice, createUserSlice } from './slices/user-store'

// Combined store type
export type GlobalStore = AuthSlice & UserSlice & ThemeSlice

// Create the global store with all slices - client-side only
export const useGlobalStore = create<GlobalStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get, api) => ({
          ...createAuthSlice(set, get, api),
          ...createUserSlice(set, get, api),
          ...createThemeSlice(set, get, api),
        }),
        {
          name: 'auth-store',
          partialize: (state) => ({
            accessToken: state.accessToken,
            expiresAt: state.expiresAt,
            user: state.user?.id ? state.user : null,
            theme: state.theme,
          }),
          version: 1,
          skipHydration: true,
        },
      ),
    ),
    {
      name: 'GlobalStore',
    },
  ),
)

// Selectors for better performance and convenience
// Using shallow equality to prevent unnecessary re-renders
export const useAuth = () => {
  const isAuthenticated = useGlobalStore((state) => state.isAuthenticated)
  const accessToken = useGlobalStore((state) => state.accessToken)
  const refreshToken = useGlobalStore((state) => state.refreshToken)
  const expiresAt = useGlobalStore((state) => state.expiresAt)
  const isLoading = useGlobalStore((state) => state.isLoading)
  const error = useGlobalStore((state) => state.error)
  const authenticate = useGlobalStore((state) => state.authenticate)
  const signOut = useGlobalStore((state) => state.signOut)
  const refreshAccessToken = useGlobalStore((state) => state.refreshAccessToken)
  const isTokenExpired = useGlobalStore((state) => state.isTokenExpired)
  const validateAndRestoreSession = useGlobalStore((state) => state.validateAndRestoreSession)
  const setLoading = useGlobalStore((state) => state.setLoading)
  const setError = useGlobalStore((state) => state.setError)
  const setWalletAddress = useGlobalStore((state) => state.setWalletAddress)

  return {
    isAuthenticated,
    accessToken,
    refreshToken,
    expiresAt,
    isLoading,
    error,
    authenticate,
    signOut,
    refreshAccessToken,
    isTokenExpired,
    validateAndRestoreSession,
    setLoading,
    setError,
    setWalletAddress,
  }
}

export const useUser = () => {
  const user = useGlobalStore((state) => state.user)
  const isLoading = useGlobalStore((state) => state.isLoading)
  const error = useGlobalStore((state) => state.error)
  const setUser = useGlobalStore((state) => state.setUser)
  const updateUser = useGlobalStore((state) => state.updateUser)
  const clearUser = useGlobalStore((state) => state.clearUser)
  const setLoading = useGlobalStore((state) => state.setLoading)
  const setError = useGlobalStore((state) => state.setError)

  return {
    user,
    isLoading,
    error,
    setUser,
    updateUser,
    clearUser,
    setLoading,
    setError,
  }
}

export const useTheme = () => {
  const theme = useGlobalStore((state) => state.theme)
  const setTheme = useGlobalStore((state) => state.setTheme)
  const toggleTheme = useGlobalStore((state) => state.toggleTheme)

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
