import { StateCreator } from 'zustand'

export interface IUser {
  id: string
  refCount: number
  referralCode: string
  hasAcceptTerm: boolean
  dateCreated: string
  dateModified: string
  email?: string
  name?: string
  walletAddress?: string
  ownerWalletAddress?: string
  privyUserId?: string
  walletProvider?: string
}

export interface IUserState {
  user: IUser | null
  isLoading: boolean
  error: string | null
}

export interface IUserActions {
  setUser: (user: IUser) => void
  updateUser: (updates: Partial<IUser>) => void
  clearUser: () => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setWalletAddress: (address: string) => void
  setOwnerWalletAddress: (address: string) => void
}

export type UserSlice = IUserState & IUserActions

const initialState: IUserState = {
  user: null,
  isLoading: false,
  error: null,
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  ...initialState,
  setUser: (user) =>
    set({
      user,
      isLoading: false,
      error: null,
    }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  clearUser: () => set(initialState),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) =>
    set({
      error,
      isLoading: false,
    }),
  setWalletAddress: (address) =>
    set((state) => ({
      user: state.user ? { ...state.user, walletAddress: address } : null,
    })),
  setOwnerWalletAddress: (address) =>
    set((state) => ({
      user: state.user ? { ...state.user, ownerWalletAddress: address } : null,
    })),
})
