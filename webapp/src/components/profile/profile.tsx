'use client'

import { getUserDetails } from '@/services/user.service'
import { useAuth, useUser } from '@/store'
import { Divider } from '@heroui/divider'
import { DropdownItem, DropdownMenu } from '@heroui/dropdown'
import { useLogout } from '@privy-io/react-auth'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { shortenAddress } from 'otomato-sdk'
import { useEffect } from 'react'
import { Button } from '../ui/button'
import DropdownCustom from '../ui/dropdown/dropdown'

interface IUserProfileProps {
  walletIcon: string
  ownerWalletAddress: string
}

const UserProfile = ({ walletIcon = '', ownerWalletAddress = '' }: IUserProfileProps) => {
  const { user, setUser, clearUser } = useUser()
  const { signOut } = useAuth()

  const handleLogoutSuccess = () => {
    clearUser()
    signOut()
  }

  const { logout } = useLogout({
    onSuccess: handleLogoutSuccess,
  })

  useEffect(() => {
    if (user) {
      return
    }

    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails()
        setUser(userDetails)
      } catch (error) {
        console.log('Failed to fetch user:', error)
      }
    }

    fetchUserDetails()
  }, [user, setUser])

  return (
    <DropdownCustom
      placement="bottom-end"
      dropdownClassName="w-40 rounded-xl bg-rgba10-150 border border-rgba255-100 backdrop-blur-[2.5rem] p-2"
      trigger={
        <Button
          variant="black"
          leftIcon={<Image src={walletIcon} alt="wallet-icon" width={20} height={20} />}
        >
          <span className="font-medium text-sm rounded-xl">
            {shortenAddress(ownerWalletAddress)}
          </span>
        </Button>
      }
    >
      <DropdownMenu aria-label="Profile" className="p-0">
        <DropdownItem key="profile" className="px-2 py-1 hover:bg-rgba128-450 rounded-md">
          <p className="font-medium text-sm">{shortenAddress(user?.walletAddress || '')}</p>
          <p className="text-xs">Smart Account</p>
        </DropdownItem>
        <DropdownItem key="divider">
          <Divider orientation="horizontal" className="my-2 text-rgba255-300" />
        </DropdownItem>
        <DropdownItem
          key="logout"
          className="px-2 py-1 hover:bg-rgba128-450 rounded-md"
          textValue="Logout"
          onClick={logout}
        >
          <p className="font-medium text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </p>
        </DropdownItem>
      </DropdownMenu>
    </DropdownCustom>
  )
}

export default UserProfile
