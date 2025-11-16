'use client'

import UserProfile from '@/components/profile/profile'
import { Button } from '@/components/ui/button'
import { getUserToken } from '@/services/auth.service'
import { useAuth } from '@/store/client-store'
import { PrivyErrorCode, useLogin, useLogout, usePrivy, useWallets } from '@privy-io/react-auth'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { createKernelAccount } from '@zerodev/sdk'
import { getEntryPoint } from '@zerodev/sdk/constants'
import { Signer } from '@zerodev/sdk/types'
import { memo, useCallback, useMemo, useState } from 'react'
import { createPublicClient, defineChain, http } from 'viem'

const baseChainId = 8453

const baseRpcConfig = {
  zerodev: process.env.NEXT_PUBLIC_ZERODEV_BASE_RPC,
  custom: process.env.NEXT_PUBLIC_BASE_HTTPS_PROVIDER,
  alchemy: process.env.NEXT_PUBLIC_ALCHEMY_BASE_RPC,
  pimlicoBundler: process.env.NEXT_PUBLIC_PIMLICO_BASE_BUNDLER_RPC,
}

const baseDefined = defineChain({
  id: baseChainId,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    name: 'Base',
    symbol: 'BASE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [baseRpcConfig.zerodev!],
    },
  },
  blockExplorers: {
    default: { name: 'Base Scan', url: 'https://basescan.org' },
  },
  testnet: false,
})

const WalletConnection = () => {
  const { ready, authenticated, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const { isAuthenticated, authenticate } = useAuth()

  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const activeWallet = useMemo(() => {
    if (wallets.length === 0) return null

    // Priority 1: Find injected wallet (browser extension like MetaMask, Rabby)
    const injectedWallet = wallets.find((w) => w.connectorType === 'injected')
    if (injectedWallet) return injectedWallet

    // Priority 2: Find WalletConnect wallet
    const walletConnectWallet = wallets.find((w) => w.connectorType === 'wallet_connect')
    if (walletConnectWallet) return walletConnectWallet

    // Priority 3: Find any non-Privy external wallet
    const externalWallet = wallets.find((w) => w.walletClientType !== 'privy')
    if (externalWallet) return externalWallet

    // Fallback: Use first wallet (likely embedded)
    return wallets[0]
  }, [wallets])

  // Only show connected state when:
  // 1. Our auth store has a token
  // 2. Privy is ready and authenticated
  // 3. We have a primary wallet
  const showConnected = isAuthenticated && ready && authenticated && !!activeWallet

  const handleCreateSmartAccount = useCallback(async (signer: Signer) => {
    const publicClient = createPublicClient({
      transport: http(baseRpcConfig.zerodev),
      chain: baseDefined,
    })

    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      entryPoint: getEntryPoint('0.7'),
      signer,
      kernelVersion: '0.3.1',
    })

    const account = await createKernelAccount(publicClient, {
      entryPoint: getEntryPoint('0.7'),
      kernelVersion: '0.3.1',
      plugins: {
        sudo: ecdsaValidator,
      },
    })

    return account
  }, [])

  const handleLoginComplete = useCallback(async () => {
    if (isAuthenticated) {
      return
    }

    setIsLoggingIn(true)
    try {
      // Step 1: Get accessToken from usePrivy().getAccessToken()
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error("Can't get access token from Privy")
      }

      // Step 2: Get the primary wallet (prefer external wallets)
      if (!activeWallet) {
        throw new Error("Can't get active wallet of Privy")
      }

      // Step 3: Create smart account from wallet
      const signer = await activeWallet.getEthereumProvider()
      const smartAccount = await handleCreateSmartAccount(signer as Signer)

      // Step 4: Call getUserToken(model) to get user token
      const { token } = await getUserToken({
        walletAddress: smartAccount.address,
        ownerWalletAddress: activeWallet.address,
        accessToken: accessToken,
      })

      if (!token) {
        throw new Error("Can't get token from API")
      }

      // Step 5: Save token to authentication store
      authenticate(token)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.log('Failed to login:', errorMessage)
    } finally {
      setIsLoggingIn(false)
    }
  }, [isAuthenticated, activeWallet, authenticate, getAccessToken, handleCreateSmartAccount])

  const handleLoginError = (error: PrivyErrorCode) => {
    console.log('login error', error)
    setIsLoggingIn(false)
  }

  const handleLogoutSuccess = useCallback(() => {
    // TODO: Implement logout - clear backend token and Privy session
  }, [])

  const { login } = useLogin({
    onComplete: handleLoginComplete,
    onError: handleLoginError,
  })

  useLogout({
    onSuccess: handleLogoutSuccess,
  })

  return (
    <div className="flex items-center">
      {showConnected ? (
        <UserProfile
          walletIcon={activeWallet?.meta?.icon || ''}
          ownerWalletAddress={activeWallet?.address || ''}
        />
      ) : (
        <Button
          variant="black"
          disabled={isLoggingIn || !ready}
          isLoading={isLoggingIn}
          onClick={login}
        >
          <span className="font-medium text-sm rounded-xl">
            {isLoggingIn ? 'Connecting...' : 'Connect Wallet'}
          </span>
        </Button>
      )}
    </div>
  )
}

export default memo(WalletConnection)
