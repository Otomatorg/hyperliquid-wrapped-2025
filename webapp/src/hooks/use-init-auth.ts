'use client'

import { useAuth } from '@/store/client-store'
import { useEffect, useState } from 'react'

/**
 * Initialize authentication on app load
 * - Restores session from localStorage if valid
 * - Clears expired tokens automatically
 * - Only runs on client-side to prevent hydration issues
 */
export const useInitAuth = () => {
  const { validateAndRestoreSession } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    validateAndRestoreSession()
    setIsInitialized(true)
  }, [validateAndRestoreSession])

  return isInitialized
}
