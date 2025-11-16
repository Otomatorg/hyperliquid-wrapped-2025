'use client'

import DocsIcon from '@/public/icons/ic-documentation.svg'
import FeedbackIcon from '@/public/icons/ic-feedback.svg'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'

const Footer = () => {
  return (
    <div className="container-2xl min-h-16 sm:h-25 shrink-0 mt-auto py-4 sm:py-0">
      <div className="w-full h-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        <p className="text-xs sm:text-sm text-rgba255-600 text-center sm:text-left">© 2025 Otomato. All rights reserved.</p>

        <div className="flex items-center gap-2">
          <Link href="https://otomato.canny.io/feature-requests" target="_blank">
            <Button
              variant="secondary"
              className="rounded-full text-xs sm:text-sm"
              leftIcon={<Image src={FeedbackIcon.src} width={16} height={16} className="sm:w-5 sm:h-5" alt="feedback" />}
            >
              <span className="hidden sm:inline">Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </Button>
          </Link>

          <Link href="https://otomato.gitbook.io/v1" target="_blank">
            <Button
              variant="secondary"
              className="rounded-full text-xs sm:text-sm"
              leftIcon={<Image src={DocsIcon.src} width={16} height={16} className="sm:w-5 sm:h-5" alt="docs" />}
            >
              Docs
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Footer
