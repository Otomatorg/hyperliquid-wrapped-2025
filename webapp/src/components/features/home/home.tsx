'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import {
  LOADING_MESSAGES,
  LOADING_MESSAGE_DURATION_MS,
  PROGRESS_FRAME_INTERVAL_MS,
} from './constants'
import GetStarted from './get-started/get-started'
import LoadingProcess from './loading-process/loading-process'
import ViewArchives from './view-achievements/achievements'
import LavaLogo from '@/public/images/lava_network_a_new_era_of_blockchain_data_access-removebg-preview.png'

const Home = () => {
  const [isGettingStarted, setIsGettingStarted] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) return

    // Make API call when loading starts
    const makeSampleApiCall = async () => {
      // Get wallet address from localStorage (stored in previous step)
      const walletAddress = localStorage.getItem('wallet')

      if (!walletAddress) {
        console.warn('No wallet address found in localStorage')
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const url = `${apiUrl}/user?address=${encodeURIComponent(walletAddress)}`

        console.log('Fetching from:', url)

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          // Add credentials if needed for CORS
          // credentials: 'include',
        })

        console.log('Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Response error:', errorText)
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('Successfully fetched user data:', data)

        localStorage.setItem(`wallet-${walletAddress}`, JSON.stringify(data))

      } catch (error) {
        // Handle error - store error message in wallet-{address} key
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.error('❌ Network error - Failed to fetch:', {
            message: error.message,
            stack: error.stack,
            possibleCauses: [
              'Server not running on http://localhost:3002',
              'CORS issue - server needs to allow requests from this origin',
              'Network connectivity issue',
              'Firewall blocking the request'
            ]
          })
          console.warn('⚠️ Using fallback data. Make sure the server is running and CORS is configured properly.')
        } else {
          console.error('❌ API call failed:', error)
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack
            })
          }
        }
        if (walletAddress) {
          const errorMessage =
            error instanceof Error ? error.message : 'API call failed'
          // localStorage.setItem(
          //   `wallet-${walletAddress}`,
          //   JSON.stringify({ error: errorMessage }),
          // )
          localStorage.setItem(`wallet-${walletAddress}`, JSON.stringify(
{
    "rank": 11846,
    "firstActivityDate": "August 15, 2025",
    "daysSinceFirstActivity": 93,
    "gas": {
        "value": 0.1187163441719204,
        "rank": {
            "rank": 4515,
            "totalAddresses": 643703,
            "percentile": 99.3
        }
    },
    "nonce": {
        "value": 142,
        "rank": {
            "rank": 23920,
            "totalAddresses": 643703,
            "percentile": 96.3
        }
    },
    "EarlyRank": {
        "rank": 245034,
        "percentile": 62
    },
    "HypercoreTrades": 14,
    "HypercoreVolume": "69.4k$",
    "numberOfProtocolsUsed": 11,
    "protocolBadges": [
        "felix",
        "hyperbeat",
        "hyperlend",
        "hypersurface",
        "hypurrfi",
        "kinetiq",
        "morpho",
        "pendle",
        "projectx",
        "rysk",
        "ventuals"
    ],
    "topPoints": [
        {
            "label": "Top 88%",
            "icon": "hyperlend"
        },
        {
            "label": "Top 88%",
            "icon": "hypurrfi"
        },
        {
            "label": "Top 81%",
            "icon": "ultrasolid"
        }
    ],
    "allPoints": {
        "ventuals": {
            "point": 40.967456377231855,
            "rank": 1945,
            "percentile": 77.4
        },
        "ultrasolid": {
            "point": 25.453717733443987,
            "rank": 5609,
            "percentile": 81.3
        },
        "hyperbeat": {
            "point": 53.22246528,
            "rank": 13784,
            "percentile": 54.9
        },
        "hyperlend": {
            "point": 1273.121,
            "rank": 6002,
            "percentile": 87.8
        },
        "felix": {
            "point": 13.224138192663755,
            "rank": 7913,
            "percentile": 77.9
        },
        "hypurrfi": {
            "point": 27225,
            "rank": 4990,
            "percentile": 87.6
        }
    },
    "avatar": "hypio",
    "userBadge": "shark",
    "general": {
        "transactions": "151",
        "og": "Joined before 50% of users",
        "archetype": "Yield alchemist",
        "archetypeDescription": "This chad knows how to generate yield"
    }
}
          ))
        }
      }
    }

    makeSampleApiCall()

    const totalDuration = LOADING_MESSAGES.length * LOADING_MESSAGE_DURATION_MS
    const startTime = performance.now()

    const progressInterval = window.setInterval(() => {
      const elapsed = performance.now() - startTime
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100)
      setProgress(newProgress)

      const newMessageIndex = Math.min(
        Math.floor(elapsed / LOADING_MESSAGE_DURATION_MS),
        LOADING_MESSAGES.length - 1,
      )
      setCurrentMessageIndex(newMessageIndex)

      if (newProgress >= 100) {
        clearInterval(progressInterval)
        setIsLoading(false)
        setIsGettingStarted(false)
      }
    }, PROGRESS_FRAME_INTERVAL_MS)

    return () => clearInterval(progressInterval)
  }, [isLoading])

  const handleSubmit = useCallback(() => {
    setIsLoading(true)
    setCurrentMessageIndex(0)
    setProgress(0)
  }, [])

  if (isLoading) {
    return (
      <div className="container-lg h-full">
        <LoadingProcess message={LOADING_MESSAGES[currentMessageIndex]} progress={progress} />
      </div>
    )
  }

  return (
    <div className="container-xl h-full relative" suppressHydrationWarning>
      {isGettingStarted ? <GetStarted onSubmit={handleSubmit} /> : <ViewArchives />}
      {/* <GetStarted onSubmit={handleSubmit} /> */}

      {/* Made with love section */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-rgba255-600">
        <span>Made with</span>
        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        <span>Thanks to</span>
        <Image src={LavaLogo} alt="Lava logo" width={100} height={30} />

      </div>
    </div>
  )
}

export default Home
