'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@heroui/react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { HIGHLIGHT_STRUCTURE, HIGHLIGHT_VISUAL } from '../constants'

import catbalLogo from '@/public/protocols/catbal.webp'
import felixLogo from '@/public/protocols/felix.webp'
import gliquidLogo from '@/public/protocols/gliquid.webp'
import hlnamesLogo from '@/public/protocols/hlnames.webp'
import hybraLogo from '@/public/protocols/hybra.webp'
import hyperbeatLogo from '@/public/protocols/hyperbeat.webp'
import hyperlendLogo from '@/public/protocols/hyperlend.webp'
import hyperliquidLogo from '@/public/protocols/hyperliquid.webp'
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
import prjxLogo from '@/public/protocols/prjx.webp'
import ryskLogo from '@/public/protocols/rysk.webp'
import theoLogo from '@/public/protocols/theo.webp'
import ultrasolidLogo from '@/public/protocols/ultrasolid.webp'
import ventualsLogo from '@/public/protocols/ventuals.webp'

const protocolsLogos = {
  catbal: catbalLogo,
  felix: felixLogo,
  gliquid: gliquidLogo,
  hlnames: hlnamesLogo,
  hybra: hybraLogo,
  hyperbeat: hyperbeatLogo,
  hyperlend: hyperlendLogo,
  hyperliquid: hyperliquidLogo,
  hypersurface: hypersurfaceLogo,
  hyperswap: hyperswapLogo,
  hypionfts: hypionftsLogo,
  HypioNFTS: hypionftsLogo,
  hypurrfi: hypurrfiLogo,
  hypurrnfts: hypurrnftsLogo,
  HypurrNFTS: hypurrnftsLogo,
  kinetiq: kinetiqLogo,
  morpho: morphoLogo,
  nunchi: nunchiLogo,
  pendle: pendleLogo,
  projectx: projectxLogo,
  prjx: prjxLogo,
  rysk: ryskLogo,
  theo: theoLogo,
  ultrasolid: ultrasolidLogo,
  ventuals: ventualsLogo,
}

// Helper function to normalize protocol names for comparison
const normalizeProtocolName = (name: string): string => {
  return name.toLowerCase()
}

// Helper function to get display name from protocol key
const getDisplayName = (protocolKey: string): string => {
  // Convert key to display name (capitalize first letter, handle special cases)
  if (protocolKey === 'HypioNFTS') return 'HypioNFTS'
  if (protocolKey === 'HypurrNFTS') return 'HypurrNFTS'
  if (protocolKey === 'hlnames') return 'HLNames'
  if (protocolKey === 'gliquid') return 'GLiquid'
  return protocolKey.charAt(0).toUpperCase() + protocolKey.slice(1)
}

// Helper function to extract percentage from topPoints label (e.g., "Top 0.1%" -> "0.1")
const extractPercentage = (label: string): string => {
  const match = label.match(/Top\s+([\d.]+)%/)
  return match ? match[1] : ''
}

const ProjectAchievements = () => {
  const [headerText, setHeaderText] = useState('')
  const [highlightText, setHighlightText] = useState('')
  const [activateHighlight, setActivateHighlight] = useState(false)
  const [firstItemText, setFirstItemText] = useState('')
  const [showAllItems, setShowAllItems] = useState(false)
  const [animateProgress, setAnimateProgress] = useState(false)

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

  // Build accumulated points from localStorage data
  const accumulatedPoints = useMemo(() => {
    if (!userData?.allPoints) {
      return []
    }

    const allPoints = userData.allPoints
    const topPoints = userData.topPoints || []

    // Create a map of topPoints for quick lookup
    const topPointsMap = new Map<string, string>()
    topPoints.forEach((item: { label: string; icon: string }) => {
      const normalizedIcon = normalizeProtocolName(item.icon)
      const percentage = extractPercentage(item.label)
      topPointsMap.set(normalizedIcon, percentage)
    })

    // Convert allPoints object to array and map to the required format
    return Object.entries(allPoints)
      .map(([protocolKey, data]: [string, any]) => {
        const normalizedKey = normalizeProtocolName(protocolKey)
        const logo = protocolsLogos[protocolKey as keyof typeof protocolsLogos] || protocolsLogos[normalizedKey as keyof typeof protocolsLogos]

        // Prioritize percentile from allPoints data, fallback to topPoints map, or empty string
        const topProject = data.percentile !== undefined && data.percentile !== null
          ? String(data.percentile)
          : topPointsMap.get(normalizedKey) || ''

        const points = data.point || 0
        const progress = Math.min((points / 1000) * 100, 100) // Calculate progress based on points (assuming 1000 is max)

        return {
          key: protocolKey,
          name: getDisplayName(protocolKey),
          image: logo,
          topProject,
          points: points.toLocaleString(),
          progress: Math.round(progress),
        }
      })
      .filter((item) => item.image) // Only include protocols with valid logos
      .sort((a, b) => Number(b.points.replace(/,/g, '')) - Number(a.points.replace(/,/g, ''))) // Sort by points descending
  }, [userData])

  const headerFullText = "You've accumulated points on"
  const totalProjects = 21
  const projectsWithPoints = accumulatedPoints.length
  const highlightFullText = `${projectsWithPoints}/${totalProjects} projects`
  const firstItemName = accumulatedPoints[0]?.name || ''

  // Animate header text
  useEffect(() => {
    if (headerText.length < headerFullText.length) {
      const timeout = setTimeout(() => {
        setHeaderText(headerFullText.slice(0, headerText.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    } else if (highlightText.length < highlightFullText.length) {
      // Header complete, start highlight text
      const timeout = setTimeout(() => {
        setHighlightText(highlightFullText.slice(0, highlightText.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    }
  }, [headerText, highlightText, headerFullText, highlightFullText])

  // Activate highlight styling after text completes
  useEffect(() => {
    if (highlightText === highlightFullText && highlightText.length > 0) {
      const timeout = setTimeout(() => {
        setActivateHighlight(true)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [highlightText, highlightFullText])

  // Animate first item text after highlight completes
  useEffect(() => {
    if (activateHighlight && firstItemText.length < firstItemName.length) {
      const timeout = setTimeout(() => {
        setFirstItemText(firstItemName.slice(0, firstItemText.length + 1))
      }, 40)
      return () => clearTimeout(timeout)
    } else if (firstItemText === firstItemName && firstItemText.length > 0) {
      // First item text complete, show all items together
      const timeout = setTimeout(() => {
        setShowAllItems(true)
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [firstItemText, firstItemName, activateHighlight])

  // Trigger all progress bar animations together
  useEffect(() => {
    if (showAllItems) {
      const timeout = setTimeout(() => {
        setAnimateProgress(true)
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [showAllItems])

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="shrink-0 relative">
        {/* Invisible full text to reserve space */}
        <div className="opacity-0 pointer-events-none" aria-hidden="true">
          <p className="text-4xl font-bold leading-24">
            {headerFullText}{' '}
            <span className={cn('text-4xl font-bold leading-24', HIGHLIGHT_STRUCTURE)}>
              {highlightFullText}
            </span>
          </p>
        </div>

        {/* Visible typewriter text positioned absolutely */}
        <div className="absolute top-0 left-0 w-full">
          <p className="text-4xl font-bold leading-24">
            {headerText}
            {headerText === headerFullText && highlightText && (
              <>
                {' '}
                <span
                  className={cn(
                    'text-4xl font-bold leading-24 transition-all duration-500',
                    HIGHLIGHT_STRUCTURE,
                    HIGHLIGHT_VISUAL,
                  )}
                >
                  {highlightText}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
        }}
      >
        <div className="flex flex-col gap-6">
          {accumulatedPoints.map((point, index) => {
          const isFirstItem = index === 0
          const delay = index * 30

          return (
            <div
              key={point.key || point.name}
              className={cn(
                'flex gap-8 transition-all duration-700 ease-out',
                showAllItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
              )}
              style={{ transitionDelay: `${delay}ms` }}
            >
              <div className="w-16 h-16 shrink rounded-full border border-rgba255-300 bg-rgba55-55-55-170 flex items-center justify-center">
                <Image
                  src={point.image}
                  className="rounded-full object-cover"
                  width="42"
                  height="42"
                  alt="protocol-logo"
                />
              </div>

              <div className="grow flex flex-col gap-3">
                <div className="text-xl font-semibold">
                  {isFirstItem ? firstItemText : point.name}
                </div>
                <div className="w-full">
                  <Progress
                    aria-label="Loading Progress"
                    value={animateProgress ? point.progress : 0}
                    className="w-full"
                    classNames={{
                      base: 'w-full',
                      track: 'bg-gray-525 h-1.5',
                      indicator: cn(
                        'bg-white-fff transition-all',
                        animateProgress ? 'duration-1000' : 'duration-0',
                      ),
                    }}
                  />
                </div>
                <div
                  className={cn(
                    'text-lg text-rgba255-700 transition-opacity duration-500',
                    animateProgress ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {point.topProject ? `Top ${point.topProject}%` : ''}
                </div>
              </div>

              <div
                className={cn(
                  'text-2xl font-bold leading-20 transition-opacity duration-500',
                  animateProgress ? 'opacity-100' : 'opacity-0',
                )}
              >
                {point.points} points
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

export default ProjectAchievements
