import { StateCreator } from 'zustand'

export type Theme = 'dark' | 'light' | 'system'

export interface ThemeState {
  theme: Theme
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export type ThemeSlice = ThemeState & ThemeActions

const THEME_STORAGE_KEY = 'ui-theme'

const initialState: ThemeState = {
  theme: 'dark',
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  ...initialState,

  setTheme: (theme) => {
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme)

      // Update DOM
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }

    set({ theme })
  },

  toggleTheme: () => {
    const currentTheme = get().theme
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    get().setTheme(newTheme)
  },
})
