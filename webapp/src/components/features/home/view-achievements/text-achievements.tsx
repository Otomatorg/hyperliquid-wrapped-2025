import { useTypewriter } from '@/hooks/use-typewriter'
import { cn } from '@/lib/utils'
import { memo, useMemo, useState } from 'react'
import { HIGHLIGHT_STRUCTURE, HIGHLIGHT_VISUAL, getTextContent } from '../constants'
import Ranks from './text-achievements-ranks'

const TextAchievements = () => {
  const [showRanks, setShowRanks] = useState(false)

  // Get dynamic text content from localStorage and memoize it
  const TEXT_CONTENT = useMemo(() => getTextContent(), [])

  // Convert TEXT_CONTENT to flat segments array for useTypewriter
  // Memoize to prevent recreation on every render
  const segments = useMemo(() => {
    return TEXT_CONTENT.flatMap((para, paraIndex) => {
      const paraSegments = [
        { text: para.content, isHighlight: false },
        ...para.highlights.map((h) => ({
          text: h.text,
          isHighlight: !!h.id,
          id: h.id,
        })),
      ]

      // Add newline between paragraphs (except the last one)
      if (paraIndex < TEXT_CONTENT.length - 1) {
        paraSegments.push({ text: '\n', isHighlight: false })
      }

      return paraSegments
    })
  }, [TEXT_CONTENT])

  const { visibleSegments } = useTypewriter({
    segments,
    speed: 30,
    onComplete: () => {
      setTimeout(() => setShowRanks(true), 400)
    },
  })

  return (
    <div className="flex flex-col gap-12 justify-center">
      <div className="flex flex-col gap-6 relative">
        {/* Invisible full text to reserve space */}
        <div className="opacity-0 pointer-events-none" aria-hidden="true">
          <p className="text-4xl font-bold leading-24">
            You&apos;ve been active since{' '}
            <span className={cn('text-4xl font-bold leading-24', HIGHLIGHT_STRUCTURE)}>
              17th mars (283 days)
            </span>{' '}
            have burned{' '}
            <span className={cn('text-4xl font-bold leading-24', HIGHLIGHT_STRUCTURE)}>
              1.4 $Hype
            </span>{' '}
            in gas through transactions.
          </p>
          <p className="text-4xl font-bold leading-24 mt-6">
            You&apos;ve placed{' '}
            <span className={cn('text-4xl font-bold leading-24', HIGHLIGHT_STRUCTURE)}>
              138 trades
            </span>{' '}
            on Hyperliquid, with a accumulated volume of{' '}
            <span className={cn('text-4xl font-bold leading-24', HIGHLIGHT_STRUCTURE)}> 1.2M$ </span>
          </p>
        </div>

        {/* Visible typewriter text positioned absolutely */}
        <div className="absolute top-0 left-0 w-full">
          <p className="text-4xl font-bold leading-24 whitespace-pre-line">
            {visibleSegments.map((segment, index) => {
              if (segment.isHighlight) {
                return (
                  <span
                    key={index}
                    className={cn(
                      'text-4xl font-bold leading-24 transition-all duration-500',
                      HIGHLIGHT_STRUCTURE,
                      HIGHLIGHT_VISUAL,
                    )}
                  >
                    {segment.visibleText}
                  </span>
                )
              }
              return (
                <span key={index} className="text-4xl font-bold leading-24">
                  {segment.visibleText}
                </span>
              )
            })}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'transition-opacity duration-700',
          showRanks ? 'opacity-100 animate-fadeUp' : 'opacity-0',
        )}
      >
        <Ranks />
      </div>
    </div>
  )
}

export default memo(TextAchievements)
