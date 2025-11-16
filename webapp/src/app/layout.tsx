import Footer from '@/components/footer/footer'
import Providers from '@/providers'
import BackgroundImage from '@/public/images/img-hyperevm-background.png'
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import Image from 'next/image'
import { ToastContainer } from 'react-toastify'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Otomato',
  description: 'Create your own WEB3 autonomous agent.',
  keywords: ['WEB3', 'autonomous agent', 'blockchain', 'AI', 'decentralized'],
  authors: [{ name: 'Otomato Team' }],
  creator: 'Otomato',
  publisher: 'Otomato',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://otomato.xyz',
    title: 'Otomato',
    description: 'Create your own WEB3 autonomous agent.',
    siteName: 'Otomato',
    images: [
      {
        url: 'https://cdn.prod.website-files.com/664df1d59672a3d4228b6ebb/664df3a6a39dba4ac26a4284_social.webp',
        width: 1200,
        height: 630,
        alt: 'Otomato',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Otomato',
    description: 'Create your own WEB3 autonomous agent.',
    images: [
      'https://otomato-sdk-images.s3.eu-west-1.amazonaws.com/hyperliquid.webp',
    ],
    creator: '@otomato',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0A',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${manrope.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="w-screen h-screen flex flex-col overflow-x-hidden overflow-y-auto relative">
            <Image
              src={BackgroundImage}
              alt="Background"
              fill
              priority
              quality={90}
              placeholder="blur"
              className="object-cover object-center -z-10"
            />
            <main className="grow flex flex-col relative">{children}</main>

          </div>
          <ToastContainer
            position="bottom-center"
            autoClose={5000}
            hideProgressBar
            limit={1}
            aria-label="Toast notifications"
          />
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
