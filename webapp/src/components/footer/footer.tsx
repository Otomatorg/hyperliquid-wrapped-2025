'use client'

import DocsIcon from '@/public/icons/ic-documentation.svg'
import FeedbackIcon from '@/public/icons/ic-feedback.svg'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '../ui/button'

const Footer = () => {
  return (
    <div className="container-2xl h-25 shrink-0 mt-auto">
      <div className="w-full h-full flex items-center justify-between">
        <p className="text-sm text-rgba255-600">© 2025 Otomato. All rights reserved.</p>

        <div className="flex items-center gap-2">
          <Link href="https://otomato.canny.io/feature-requests" target="_blank">
            <Button
              variant="secondary"
              className="rounded-full"
              leftIcon={<Image src={FeedbackIcon.src} width={20} height={20} alt="feedback" />}
            >
              Feedback
            </Button>
          </Link>

          <Link href="https://otomato.gitbook.io/v1" target="_blank">
            <Button
              variant="secondary"
              className="rounded-full"
              leftIcon={<Image src={DocsIcon.src} width={20} height={20} alt="docs" />}
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
