import { useEffect, useRef, useState } from 'react'

interface TypewriterSegment {
  text: string
  isHighlight?: boolean
  id?: string
}

interface UseTypewriterOptions {
  segments: TypewriterSegment[]
  speed?: number
  onComplete?: () => void
}

export const useTypewriter = ({ segments, speed = 30, onComplete }: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const fullTextRef = useRef('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fullText = segments.map((s) => String(s.text || '')).join('')

  // Reset animation when fullText changes
  useEffect(() => {
    if (fullTextRef.current !== fullText) {
      fullTextRef.current = fullText
      setDisplayedText('')
      setIsComplete(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [fullText])

  useEffect(() => {
    if (isComplete) {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    }

    if (displayedText.length < fullText.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, speed)
    } else if (displayedText.length >= fullText.length && fullText.length > 0) {
      setIsComplete(true)
      onComplete?.()
    } else if (fullText.length === 0) {
      // Handle empty text case
      setIsComplete(true)
      onComplete?.()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [displayedText, fullText, speed, isComplete, onComplete])

  const getVisibleSegments = () => {
    let charCount = 0
    const visibleSegments: Array<TypewriterSegment & { visibleText: string }> = []

    for (const segment of segments) {
      // Ensure text is always a string
      const text = String(segment.text || '')
      const segmentStart = charCount
      const segmentEnd = charCount + text.length
      charCount = segmentEnd

      if (displayedText.length >= segmentStart) {
        const visibleLength = Math.min(displayedText.length - segmentStart, text.length)
        const visibleText = text.slice(0, Math.max(0, visibleLength))

        visibleSegments.push({
          ...segment,
          visibleText,
        })
      }
    }

    return visibleSegments
  }

  return {
    displayedText,
    isComplete,
    segments,
    visibleSegments: getVisibleSegments(),
  }
}
