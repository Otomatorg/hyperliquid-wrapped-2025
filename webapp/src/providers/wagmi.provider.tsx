'use client'

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import { defineChain } from "viem";

export const hyperEVM = defineChain({
  id: 999,
  name: "Hyper EVM",
  network: "hyper-evm",
  nativeCurrency: {
    decimals: 18,
    name: "HYPE",
    symbol: "HYPE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
    public: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://hyperevmscan.io/",
    },
  },
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Lazy config creation - only create when needed and projectId exists
let config: ReturnType<typeof getDefaultConfig> | null = null

const getConfig = () => {
  if (!config && projectId) {
    config = getDefaultConfig({
      appName: 'Otomato',
      projectId: projectId,
      chains: [hyperEVM],
    })
  }
  return config
}

const queryClient = new QueryClient()

const customTheme = darkTheme({
  accentColor: "#50D2C1",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  overlayBlur: "small",
})

const WagmiRainbowKitProvider = ({ children }: { children: React.ReactNode }) => {
  // Show helpful error if projectId is missing
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md p-6 rounded-lg" style={{ backgroundColor: 'rgba(127, 29, 29, 0.2)', border: '1px solid #ef4444' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#ef4444' }}>Configuration Error</h2>
          <p className="text-white mb-4">WalletConnect Project ID is missing.</p>
          <p className="text-sm text-gray-300">
            Add <code className="bg-black px-2 py-1 rounded">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code> to your{' '}
            <code className="bg-black px-2 py-1 rounded">.env.local</code> file.
            <br />
            Get your project ID from{' '}
            <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              walletconnect.com
            </a>
          </p>
        </div>
      </div>
    )
  }

  const wagmiConfig = getConfig()
  
  if (!wagmiConfig) {
    return <>{children}</>
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          locale="en" 
          theme={{
            ...customTheme,
            colors: {
              ...customTheme.colors,
              modalBackground: "#0a0a0a",
              modalBackdrop: "transparent",
            },
            radii: {
              ...customTheme.radii,
              connectButton: "9999px"
            },
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiRainbowKitProvider
