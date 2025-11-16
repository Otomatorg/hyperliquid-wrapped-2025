import { api } from '@/lib/axios'

interface IUserToken {
  walletAddress: string // Get from zerodev when creating kernelAccount()
  ownerWalletAddress: string // Get from wallets[0]?.address of useWallets()
  accessToken: string // Get from usePrivy().getAccessToken()
}

export const getUserToken = async (model: IUserToken): Promise<{ token: string }> => {
  const response = await api.post('/auth/token', model)
  return response.data
}
