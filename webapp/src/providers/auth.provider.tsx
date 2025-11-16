'use client'

import { useInitAuth } from '@/hooks/use-init-auth'
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  useInitAuth() // Restore auth token from localStorage

  return <>{children}</>
}

export default AuthProvider
