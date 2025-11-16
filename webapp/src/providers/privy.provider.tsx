'use client'

import { PATHNAMES } from '@/constants/pathname'
import { PrivyProvider } from '@privy-io/react-auth'
import { usePathname } from 'next/navigation'
import { base } from 'viem/chains'

// Logo paths
const HYPERSWAP_LOGO = '/images/img-hyperswap-logo-v1@2x.png'
const OTOMATO_LOGO = '/images/img-otomato-logo-v1@2x.png'

const Provider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // Show helpful error if appId is missing
  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md p-6 rounded-lg" style={{ backgroundColor: 'rgba(127, 29, 29, 0.2)', border: '1px solid #ef4444' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>Configuration Error</h2>
          <p className="text-white mb-4">Privy App ID is missing.</p>
          <p className="text-sm text-gray-300">
            Add <code className="bg-black px-2 py-1 rounded">NEXT_PUBLIC_PRIVY_APP_ID</code> to your{' '}
            <code className="bg-black px-2 py-1 rounded">.env.local</code> file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: 'all-users' },
        },
        loginMethods: ['google', 'wallet'],
        defaultChain: base,
        supportedChains: [base],
        appearance: {
          theme: '#0A0A0A',
          accentColor: '#ffffff',
          landingHeader: 'Login',
          logo: pathname === PATHNAMES.HOMEPAGE ? OTOMATO_LOGO : HYPERSWAP_LOGO,
          walletList: ['metamask', 'rabby_wallet'],
          showWalletLoginFirst: true,
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

export default Provider
