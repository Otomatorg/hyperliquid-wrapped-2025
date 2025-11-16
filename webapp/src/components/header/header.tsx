'use client'

import { PATHNAMES } from '@/constants/pathname'
import HyperswapLogo from '@/public/images/img-hyperswap-logo-v1@2x.png'
import OtomatoLogo from '@/public/images/img-otomato-logo-v1@2x.png'
// import { DropdownItem, DropdownMenu } from '@heroui/react'
// import { LogOutIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import WalletConnection from './components/wallet-connection'
// import DropdownCustom from './dropdown/dropdown'

export const Header = () => {
  const pathname = usePathname()

  const headerLogo = useMemo(() => {
    return pathname === PATHNAMES.HOMEPAGE ? OtomatoLogo : HyperswapLogo
  }, [pathname])

  return (
    <header className="shrink-0 w-full h-20 py-4 flex items-center backdrop-blur-[2.34375rem] sticky top-0 left-0 z-10">
      <div className="container-2xl grid grid-cols-3 items-center">
        <div className="flex justify-start">
          <Link href={pathname} className="w-36 h-10 relative">
            <Image src={headerLogo} fill alt="header-logo" priority sizes="144px" />
          </Link>
        </div>
        <div />
        <div className="flex items-center justify-end gap-2">
          <WalletConnection />
          {/* <DropdownCustom
            trigger={
              <Button variant="black">
                <span className="font-medium text-sm rounded-xl">Connect Wallet</span>
              </Button>
            }
          >
            <DropdownMenu>
              <DropdownItem key="logout" textValue="Logout">
                <Button size="sm" leftIcon={<LogOutIcon className="w-4 h-4" />}>
                  <span className="font-medium text-sm">Logout</span>
                </Button>
              </DropdownItem>
            </DropdownMenu>
          </DropdownCustom> */}
        </div>
      </div>
    </header>
  )
}
