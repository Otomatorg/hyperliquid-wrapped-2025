'use client'

import { useTypewriter } from '@/hooks/use-typewriter'
import BackgroundImage from '@/public/images/img-hyperevm-background.png'
import OtomatoLogo from '@/public/images/img-otomato-logo-v3@2x.png'
import Image from 'next/image'

/**
 * Global loading component that waits for:
 * - Privy initialization
 * - Wallet connection (if authenticated)
 * - Auth state restoration
 */

const Loading = () => {
  const { visibleSegments } = useTypewriter({
    segments: [{ text: 'Create your own WEB3 autonomous agent.', isHighlight: false }],
    speed: 30,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Image */}
      <Image
        src={BackgroundImage}
        alt="Background"
        fill
        priority
        quality={90}
        placeholder="blur"
        className="object-cover object-center -z-10"
      />

      {/* Content */}
      <div className="flex flex-col items-center gap-6">
        <Image
          src={OtomatoLogo}
          alt="Otomato logo"
          className="w-auto h-12"
          width={134}
          height={48}
          priority
        />

        <p className="text-center min-h-8">
          {visibleSegments.map((segment, index) => (
            <span key={index} className="text-xl text-rgba255-600 font-semibold">
              {segment.visibleText}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default Loading
