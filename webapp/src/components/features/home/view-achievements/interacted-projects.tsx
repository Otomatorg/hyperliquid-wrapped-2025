'use client'

import { useTypewriter } from '@/hooks/use-typewriter'
import { cn } from '@/lib/utils'
import { Tooltip } from '@heroui/react'
import Image from 'next/image'
import { memo, useEffect, useMemo, useState } from 'react'
import { HIGHLIGHT_STRUCTURE, HIGHLIGHT_VISUAL } from '../constants'

import catbalLogo from '@/public/protocols/catbal.webp'
import felixLogo from '@/public/protocols/felix.webp'
import gliquidLogo from '@/public/protocols/gliquid.webp'
import hlnamesLogo from '@/public/protocols/hlnames.webp'
import hybraLogo from '@/public/protocols/hybra.webp'
import hyperbeatLogo from '@/public/protocols/hyperbeat.webp'
import hyperlendLogo from '@/public/protocols/hyperlend.webp'
import hypersurfaceLogo from '@/public/protocols/hypersurface.webp'
import hyperswapLogo from '@/public/protocols/hyperswap.webp'
import hypionftsLogo from '@/public/protocols/HypioNFTS.webp'
import hypurrfiLogo from '@/public/protocols/hypurrfi.webp'
import hypurrnftsLogo from '@/public/protocols/HypurrNFTS.webp'
import kinetiqLogo from '@/public/protocols/kinetiq.webp'
import morphoLogo from '@/public/protocols/morpho.webp'
import nunchiLogo from '@/public/protocols/nunchi.webp'
import pendleLogo from '@/public/protocols/pendle.webp'
import projectxLogo from '@/public/protocols/projectx.webp'
import ryskLogo from '@/public/protocols/rysk.webp'
import theoLogo from '@/public/protocols/theo.webp'
import ultrasolidLogo from '@/public/protocols/ultrasolid.webp'
import ventualsLogo from '@/public/protocols/ventuals.webp'

const protocolsLogos = {
  "catbal":catbalLogo,
  "felix":felixLogo,
  "gliquid":gliquidLogo,
  "hlnames":hlnamesLogo,
  "hybra":hybraLogo,
  "hyperbeat":hyperbeatLogo,
  "hyperlend":hyperlendLogo,
  "hypersurface":hypersurfaceLogo,
  "hyperswap":hyperswapLogo,
  "hypionfts":hypionftsLogo,
  "HypioNFTS":hypionftsLogo,
  "hypurrfi": hypurrfiLogo,
  "hypurrnfts":hypurrnftsLogo,
  "HypurrNFTS":hypurrnftsLogo,
  "kinetiq":kinetiqLogo,
  "morpho":morphoLogo,
  "nunchi":nunchiLogo,
  "pendle":pendleLogo,
  "projectx":projectxLogo,
  "rysk": ryskLogo,
  "theo": theoLogo,
  "ultrasolid": ultrasolidLogo,
  "ventuals": ventualsLogo,
}

const protocolsList = [
  "catbal",
  "felix",
  "gliquid",
  "hlnames",
  "hybra",
  "hyperbeat",
  "hyperlend",
  "hypersurface",
  "hyperswap",
  "HypioNFTS",
  "hypurrfi",
  "HypurrNFTS",
  "kinetiq",
  "morpho",
  "nunchi",
  "pendle",
  "projectx",
  "rysk",
  "theo",
  "ultrasolid",
  "ventuals",
]

// Helper function to normalize protocol names for comparison
const normalizeProtocolName = (name: string): string => {
  return name.toLowerCase()
}

// Helper function to get display name from protocol key
const getDisplayName = (protocolKey: string): string => {
  // Convert key to display name (capitalize first letter, handle special cases)
  if (protocolKey === "HypioNFTS") return "HypioNFTS"
  if (protocolKey === "HypurrNFTS") return "HypurrNFTS"
  if (protocolKey === "hlnames") return "HLNames"
  if (protocolKey === "gliquid") return "GLiquid"
  return protocolKey.charAt(0).toUpperCase() + protocolKey.slice(1)
}

const InteractedProjects = () => {
  const headerText = "You've interacted with "
  
  // Get user data from localStorage
  const userData = useMemo(() => {
    if (typeof window === 'undefined') {
      return {}
    }
    const walletAddress = localStorage.getItem('wallet')
    if (!walletAddress) {
      return {}
    }
    const userDataStr = localStorage.getItem(`wallet-${walletAddress}`)
    if (!userDataStr) {
      return {}
    }
    try {
      return JSON.parse(userDataStr)
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      return {}
    }
  }, [])

  const protocolBadges = useMemo(() => userData.protocolBadges || [], [userData])
  const highlightText = `${protocolBadges.length}/21 projects`

  // Get top project data from localStorage
  const topProject = userData.topPoints?.[0]
  const topProjectDisplayName = topProject?.icon ? getDisplayName(topProject.icon) : 'N/A'

  // Get user profile data from localStorage
  const userProfile = {
    name: userData.general?.archetype || userData.userProfile?.name || 'N/A',
    description: userData.general?.archetypeDescription || userData.userProfile?.description || 'N/A',
  }

  const [visibleRows, setVisibleRows] = useState<number[]>([])
  const [activeItems, setActiveItems] = useState<Set<number>>(new Set())
  const [showBottomSection, setShowBottomSection] = useState(false)

  const { visibleSegments } = useTypewriter({
    segments: [
      { text: headerText, isHighlight: false },
      { text: highlightText, isHighlight: true, id: 'highlight-1' },
    ],
    speed: 30,
    onComplete: () => {
      // Show rows one by one after typewriter completes
      setTimeout(() => setVisibleRows([0]), 300)
      setTimeout(() => setVisibleRows([0, 1]), 600)
      setTimeout(() => setVisibleRows([0, 1, 2]), 900)
      // Show bottom section after all rows are visible
      setTimeout(() => setShowBottomSection(true), 1200)
    },
  })

  // Create all protocols from protocolsList with their logos and active status
  const allProtocols = useMemo(() => {
    return protocolsList.map((protocolKey) => {
      const logo = protocolsLogos[protocolKey as keyof typeof protocolsLogos]
      const normalizedKey = normalizeProtocolName(protocolKey)
      const isInLocalStorage = protocolBadges.some((badge: string) =>
        normalizeProtocolName(badge) === normalizedKey
      )

      return {
        key: protocolKey,
        name: getDisplayName(protocolKey),
        image: logo,
        active: isInLocalStorage,
      }
    })
  }, [protocolBadges])

  useEffect(() => {
    // After all rows are visible, start activating items that are in localStorage
    setTimeout(() => {
      const activeIndices = allProtocols
        .map((item, index) => (item.active ? index : -1))
        .filter((index) => index !== -1)

      // Activate items one by one with increasing delays
      activeIndices.forEach((index, i) => {
        setTimeout(
          () => {
            setActiveItems((prev) => new Set([...prev, index]))
          },
          1200 + i * 200,
        ) // Start after rows fade in, 200ms between each activation
      })
    }, 0)
  }, [allProtocols])

  return (
    <div className="w-full h-full flex flex-col items-center gap-6 sm:gap-9 justify-center px-4 sm:px-0">
      <div className="shrink relative w-full">
        {/* Invisible full text to reserve space */}
        <div className="opacity-0 pointer-events-none" aria-hidden="true">
          <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-7 sm:leading-10 md:leading-16 lg:leading-24 text-center">
            {headerText}
            <span className={cn('text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-7 sm:leading-10 md:leading-16 lg:leading-24', HIGHLIGHT_STRUCTURE)}>
              {highlightText}
            </span>
          </p>
        </div>

        {/* Visible typewriter text positioned absolutely */}
        <div className="absolute top-0 left-0 w-full">
          <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-7 sm:leading-10 md:leading-16 lg:leading-24 text-center">
            {visibleSegments.map((segment, index) =>
              segment.isHighlight ? (
                <span
                  key={segment.id || index}
                  className={cn(
                    'text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-7 sm:leading-10 md:leading-16 lg:leading-24 transition-all duration-500',
                    HIGHLIGHT_VISUAL,
                    'bg-transparent',
                  )}
                >
                  {segment.visibleText}
                </span>
              ) : (
                <span key={index} className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-7 sm:leading-10 md:leading-16 lg:leading-24">
                  {segment.visibleText}
                </span>
              ),
            )}
          </p>
        </div>
      </div>

      <div className="shrink flex flex-col gap-4 sm:gap-6 md:gap-9 relative z-1 w-full">
        {[0, 1, 2].map((rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              'flex gap-3 sm:gap-5 md:gap-7 lg:gap-9 items-center justify-center transition-all duration-700 flex-wrap',
              visibleRows.includes(rowIndex)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4',
            )}
          >
            {allProtocols.slice(rowIndex * 7, (rowIndex + 1) * 7).map((item, indexInRow) => {
              const globalIndex = rowIndex * 7 + indexInRow
              const isActive = activeItems.has(globalIndex)

              return (
                <Tooltip
                  key={item.key + indexInRow}
                  content={item.name}
                  placement="top"
                  showArrow
                  classNames={{
                    base: 'backdrop-blur-md',
                    content:
                      'bg-rgba55-55-55-170 rounded-lg text-white-fff px-3 py-2 font-semibold text-xs sm:text-sm',
                    arrow: 'bg-rgba55-55-55-170',
                  }}
                >
                  <div
                    className={cn(
                      'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-25 lg:h-25 rounded-full flex items-center border border-rgba255-300 bg-rgba55-55-55-100 justify-center overflow-hidden backdrop-blur-[1.5rem] cursor-pointer transition-all duration-500 shrink-0',
                      isActive ? 'shadow-lg' : 'opacity-19',
                    )}
                  >
                    <Image
                      src={item.image}
                      className="rounded-full object-cover"
                      width="70"
                      height="70"
                      alt="protocol-logo"
                    />
                  </div>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div
        className={cn(
          'grow w-full flex flex-col items-center gap-6 sm:gap-9 transition-all duration-700',
          showBottomSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 md:gap-12 mt-auto relative z-99 w-full px-4 sm:px-0">
          <div className="flex-1 flex flex-col gap-4 sm:gap-6 w-full sm:w-auto">
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-rgba255-600 text-center">Top Project</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
              {topProjectDisplayName} you&apos;re in the <br />
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-50d">
                {topProject?.label ? topProject.label.toLowerCase() : 'N/A'}
              </span>
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-2 w-full sm:w-auto">
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-rgba255-600 text-center">User Profile</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-cyan-50d">
              {userProfile.name} <br />
            </p>
            <p className="text-sm sm:text-base md:text-lg font-medium leading-6 sm:leading-8 md:leading-9 text-center">
              {userProfile.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(InteractedProjects)
