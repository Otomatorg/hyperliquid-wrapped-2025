'use client'

import { HeroUIProvider } from '@heroui/react'
import AuthProvider from './auth.provider'
import PrivyProvider from './privy.provider'
import ThemeProvider from './theme.provider'
import WagmiRainbowKitProvider from './wagmi.provider'

/**
 * Main Providers Component
 * Composes all providers in the correct order
 *
 * Provider Order:
 * 1. WagmiRainbowKitProvider - Wagmi & RainbowKit (outermost, base for wallet connections)
 * 2. ThemeProvider - UI theming
 * 3. HeroUIProvider - UI components
 * 4. PrivyProvider - Wallet connection
 * 5. AuthProvider - Authentication state & API calls
 */
const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiRainbowKitProvider>
      <ThemeProvider defaultTheme="dark">
        <HeroUIProvider>
          <PrivyProvider>
            <AuthProvider>{children}</AuthProvider>
          </PrivyProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </WagmiRainbowKitProvider>
  )
}

export default Providers
