import FelixLogo from '@/public/protocols/felix.webp'
import GliquidLogo from '@/public/protocols/gliquid.webp'
import HlnamesLogo from '@/public/protocols/hlnames.webp'
import HybraLogo from '@/public/protocols/hybra.webp'
import HyperbeatLogo from '@/public/protocols/hyperbeat.webp'
import HyperlendLogo from '@/public/protocols/hyperlend.webp'
import HyperliquidLogo from '@/public/protocols/hyperliquid.webp'
import HypersurfaceLogo from '@/public/protocols/hypersurface.webp'
import HyperswapLogo from '@/public/protocols/hyperswap.webp'
import HypioNFTSLogo from '@/public/protocols/HypioNFTS.webp'
import HypurrfiLogo from '@/public/protocols/hypurrfi.webp'
import HypurrNFTSLogo from '@/public/protocols/HypurrNFTS.webp'
import KinetiqLogo from '@/public/protocols/kinetiq.webp'
import MorphoLogo from '@/public/protocols/morpho.webp'
import PendleLogo from '@/public/protocols/pendle.webp'
import PrjxLogo from '@/public/protocols/prjx.webp'
import RyskLogo from '@/public/protocols/rysk.webp'
import VentualsLogo from '@/public/protocols/ventuals.webp'
import catbalLogo from '@/public/protocols/catbal.webp'

import defaultCatbalAvatar from '@/public/images/default_catbal.png'
import defaultHypurrAvatar from '@/public/images/default_hypurr.png'
import defaultHypioAvatar from '@/public/images/default_hypio.png'

export const ACCUMULATED_POINTS = [
  {
    image: HyperlendLogo,
    name: 'Hyperlend',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: HypurrfiLogo,
    name: 'HypurrFi',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: HyperswapLogo,
    name: 'Hyperswap',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: FelixLogo,
    name: 'Felix',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: KinetiqLogo,
    name: 'Kinetiq',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
]

export const INTERACTED_PROJECTS = [
  {
    image: HyperlendLogo,
    name: 'Hyperlend',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: HypurrfiLogo,
    name: 'Hypurrfi',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: HyperswapLogo,
    name: 'Hyperswap',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: FelixLogo,
    name: 'Felix',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: KinetiqLogo,
    name: 'Kinetiq',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
          image: HyperlendLogo,
    name: 'Hyperlend',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
  {
    image: HypurrfiLogo,
    name: 'Hypurrfi',
    topProject: '18',
    points: '10,987',
    progress: 45,
  },
]

export const ACTIVE_PROTOCOLS = [
  {
    image: HyperlendLogo,
    name: 'Hyperlend',
    topPoints: 1,
  },
  {
    image: HyperswapLogo,
    name: 'Hyperswap',
    topPoints: 8,
  },
  {
    image: HypurrfiLogo,
    name: 'HypurrFi',
    topPoints: 18,
  },
  {
    image: FelixLogo,
    name: 'Felix',
    topPoints: 0,
  },
  {
    image: KinetiqLogo,
    name: 'Kinetiq',
    topPoint: 0,
  },
]

export const ALL_PROTOCOLS_FOR_BADGES = [
  {
    image: HyperlendLogo,
    name: 'Hyperlend',
  },
  {
    image: HyperswapLogo,
    name: 'Hyperswap',
  },
  {
    image: HypurrfiLogo,
    name: 'HypurrFi',
  },
  {
    image: FelixLogo,
    name: 'Felix',
  },
  {
    image: KinetiqLogo,
    name: 'Kinetiq',
  },
  {
    image: HyperliquidLogo,
    name: 'Hyperliquid',
  },
  {
    image: HyperbeatLogo,
    name: 'Hyperbeat',
  },
  {
    image: HybraLogo,
    name: 'Hybra',
  },
  {
    image: MorphoLogo,
    name: 'Morpho',
  },
  {
    image: PendleLogo,
    name: 'Pendle',
  },
  {
    image: GliquidLogo,
    name: 'GLiquid',
  },
  {
    image: HlnamesLogo,
    name: 'HLNames',
  },
  {
    image: HypersurfaceLogo,
    name: 'Hypersurface',
  },
  {
    image: PrjxLogo,
    name: 'Prjx',
  },
  {
    image: RyskLogo,
    name: 'Rysk',
  },
  {
    image: VentualsLogo,
    name: 'Ventuals',
  },
]

export const DEFAULT_AVATAR = {
  "catbal": defaultCatbalAvatar,
  "hypurr": defaultHypurrAvatar,
  "hypio": defaultHypioAvatar,
}

export const TOTAL_STEP = 6

export enum EAchievementStep {
  TEXT_ACHIEVEMENTS = 1,
  GRID_ACHIEVEMENTS = 2,
  INTERACTED_PROJECTS = 3,
  ACCUMULATED_POINTS = 4,
  ACTIVE_ADDRESSES = 5,
  SHARE_ON_X = 6,
}

export const LOADING_MESSAGES = [
  'Retrieving the user balance...',
  'Fetching historical positions...',
  'Fetching protocol points...',
  'Fetching user airdrops...',
]

export const LOADING_MESSAGE_DURATION_MS = 800
export const PROGRESS_FRAME_INTERVAL_MS = 16



export const TEXT_CONTENT = [
  {
    id: 'text1',
    content: "You've been active since ",
    highlights: [
      { text: '17th mars (283 days)', id: 'h1' },
      { text: ' have burned ' },
      { text: '1.4 $Hype', id: 'h2' },
      { text: ' in gas through transactions.' },
    ],
  },
  {
    id: 'text2',
    content: "You've placed ",
    highlights: [
      { text: '138 trades', id: 'h3' },
      { text: ' on Hyperliquid, with a accumulated volume of ' },
      { text: '1.2M$', id: 'h4' },
    ],
  },
]

export const HIGHLIGHT_STRUCTURE = 'px-4 py-3 rounded-4xl border border-transparent'

export const HIGHLIGHT_VISUAL =
  'bg-rgba80-210-193-130 backdrop-blur-[1.375rem] text-cyan-50d border-rgba255-300'

export const COLUMN_CLASS =
  'flex flex-col gap-3 bg-rgba55-55-55-170 border border-rgba255-300 rounded-4xl px-6 pt-4 pb-6 backdrop-blur-[1.5rem]'

export const getTextContent = () => {
  if (typeof window === 'undefined') {
    return TEXT_CONTENT
  }

  const walletAddress = localStorage.getItem('wallet')
  if (!walletAddress) {
    return TEXT_CONTENT
  }

  const userDataStr = localStorage.getItem(`wallet-${walletAddress}`)
  if (!userDataStr) {
    return TEXT_CONTENT
  }

  try {
    const userData = JSON.parse(userDataStr)

    // Build dynamic text content from localStorage data
    const firstActivityDate = userData.firstActivityDate
    const daysSinceFirstActivity = userData.daysSinceFirstActivity
    const gasSpent = Math.round(userData.gas.value * 100) / 100
    const hypercoreTrades = userData.HypercoreTrades
    const hypercoreVolume = userData.HypercoreVolume

    return [
      {
        id: 'text1',
        content: "You've been active since ",
        highlights: [
          { text: `${firstActivityDate} (${daysSinceFirstActivity} days)`, id: 'h1' },
          { text: ' have burned ' },
          { text: `${gasSpent} $HYPE`, id: 'h2' },
          { text: ' in gas through transactions.' },
        ],
      },
      {
        id: 'text2',
        content: "You've placed ",
        highlights: [
          { text: `${hypercoreTrades} trades`, id: 'h3' },
          { text: ' on Hyperliquid, with a accumulated volume of ' },
          { text: String(hypercoreVolume.toLocaleString()), id: 'h4' },
        ],
      },
    ]
  } catch (error) {
    console.error('Failed to parse user data from localStorage:', error)
    return TEXT_CONTENT
  }
}
