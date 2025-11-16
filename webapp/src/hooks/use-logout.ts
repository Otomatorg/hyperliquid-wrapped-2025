'use client'

import { useAuth, useUser } from '@/store/client-store'
import { useLogout as usePrivyLogout } from '@privy-io/react-auth'
import { useCallback } from 'react'

/**
 * Custom logout hook that handles both:
 * - Backend token cleanup
 * - User data cleanup
 * - Privy session cleanup
 */
export const useLogout = () => {
  const { signOut } = useAuth()
  const { clearUser } = useUser()

  const { logout: privyLogout } = usePrivyLogout({
    onSuccess: () => {
      console.log('Privy logout successful')
    },
  })

  const logout = useCallback(async () => {
    try {
      signOut()
      clearUser()

      await privyLogout()
    } catch (error) {
      console.log('Logout failed:', error)
    }
  }, [signOut, clearUser, privyLogout])

  return { logout }
}

export default useLogout
