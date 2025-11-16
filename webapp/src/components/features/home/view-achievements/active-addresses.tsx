import useCountAnimation from '@/hooks/use-count-animation'
import { cn } from '@/lib/utils'
import OtomatoBlurV1 from '@/public/images/img-blur-otomato-logo-v1@2x.png'
import OtomatoBlurV2 from '@/public/images/img-blur-otomato-logo-v2@2x.png'
import Image from 'next/image'
import { memo, useEffect, useState, useMemo } from 'react'

const ActiveAddresses = () => {
  const [showText, setShowText] = useState(false)
  const [startCount, setStartCount] = useState(false)
  const TOTAL_ADDRESSES = 634049

  // Get user data from localStorage
  const userData = useMemo(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const walletAddress = localStorage.getItem('wallet')
    if (!walletAddress) {
      return null
    }

    const userDataStr = localStorage.getItem(`wallet-${walletAddress}`)
    if (!userDataStr) {
      return null
    }

    try {
      return JSON.parse(userDataStr)
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      return null
    }
  }, [])

  const USER_RANK = userData?.rank

  useEffect(() => {
    // Show text after images zoom in (1.3s)
    setTimeout(() => setShowText(true), 1300)
    // Start counting after text fades in (1.3s + 0.7s)
    setTimeout(() => setStartCount(true), 2000)
  }, [])

  // Animate from 0 to (TOTAL_ADDRESSES - USER_RANK), then subtract from TOTAL_ADDRESSES to get countdown effect
  const animatedValue = useCountAnimation(startCount ? TOTAL_ADDRESSES - USER_RANK : 0, 2000)
  const count = TOTAL_ADDRESSES - animatedValue

  return (
    <div className="w-full h-full relative">
      {/* Left image with 3D animation */}
      <div className="absolute left-0 top-45 animate-float-3d">
        <Image
          src={OtomatoBlurV1}
          alt="otomato-blur-v1"
          width={124}
          height={124}
          style={{
            transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
            transformStyle: 'preserve-3d',
          }}
        />
      </div>

      {/* Right image with 3D animation */}
      <div className="absolute right-6 top-45 animate-float-3d-reverse">
        <Image
          src={OtomatoBlurV2}
          alt="otomato-blur-v2"
          width={174}
          height={174}
          style={{
            transform: 'perspective(1000px) rotateY(15deg) rotateX(-5deg)',
            transformStyle: 'preserve-3d',
          }}
        />
      </div>

      <div
        className={cn(
          'w-full h-full flex flex-col items-center justify-center gap-6 transition-all duration-700',
          showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        )}
      >
        <p className="text-3xl text-rgba255-600 text-center font-medium">
          Out of 634,049 active addresses, you are
        </p>
        <p className="text-9xl text-center font-bold">#{count.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default memo(ActiveAddresses)
