'use client'

import { useTheme as useThemeStore } from '@/store/client-store'
import { useEffect } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

const ThemeProvider = ({ children, defaultTheme = 'dark' }: ThemeProviderProps) => {
  const { theme, setTheme } = useThemeStore()

  // Initialize theme on mount
  useEffect(() => {
    // If no theme is set in store, set the default
    if (!theme) {
      setTheme(defaultTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    if (!theme) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
}

export default ThemeProvider

import { Button } from '@/components/ui/button/button'
import { Moon, Sun } from 'lucide-react'

export const ThemeToggle = () => {
  const { toggleTheme } = useThemeStore()

  return (
    <Button variant="primary" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// Re-export useTheme from the store for convenience
export { useTheme } from '@/store/client-store'
