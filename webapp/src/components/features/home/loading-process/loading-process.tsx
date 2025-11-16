'use client'

import OtomatoLogo from '@/public/images/img-otomato-logo-v3@2x.png'
import { Progress } from '@heroui/react'
import Image from 'next/image'
import { memo } from 'react'

interface LoadingProcessProps {
  message: string
  progress: number
}

const LoadingProcess = ({ message, progress }: LoadingProcessProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-12">
      <div className="w-full max-w-120 flex flex-col items-center gap-6">
        <div className="shrink-0">
          <Image src={OtomatoLogo} width="134" height="40" alt="otomato-logo" />
        </div>

        <Progress
          aria-label="Loading Progress"
          value={progress}
          className="w-full"
          classNames={{
            base: 'w-full',
            track: 'bg-gray-525 h-1',
            indicator: 'bg-white-fff',
          }}
        />

        <p
          className="text-white font-medium text-center leading-9 animate-slide-down"
          key={message}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

export default memo(LoadingProcess)
