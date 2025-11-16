import { api } from '@/lib/axios'
import { IUser } from '@/store/slices/user-store'

export const getUserDetails = async (): Promise<IUser> => {
  const response = await api.get('/users/me')
  return response.data
}
