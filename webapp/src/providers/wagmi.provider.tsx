'use client'

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
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

const config = getDefaultConfig({
  appName: 'Otomato',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '', // Get from walletconnect.com
  chains: [hyperEVM],
})

const queryClient = new QueryClient()

const WagmiRainbowKitProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en" theme={{
          colors: {
            accentColor: "#50D2C1",         // your custom background
            accentColorForeground: "#ffffff",  // your custom text color
            modalBackground: "#0a0a0a",     // modal dialog background
            modalBackdrop: "transparent",   // backdrop overlay - transparent
          },
          radii: {
            connectButton: "9999px"
          },
        }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiRainbowKitProvider
