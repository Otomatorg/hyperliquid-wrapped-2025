import useCountAnimation from '@/hooks/use-count-animation'
import { cn } from '@/lib/utils'
import AnimeImage from '@/public/images/img-anime@2x.png'
import Image from 'next/image'
import { useEffect, useState, useMemo } from 'react'
import { COLUMN_CLASS, DEFAULT_AVATAR } from '../constants'



const GridAchievements = () => {
  const [showBlocks, setShowBlocks] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // Fetch data from localStorage only on client side
  useEffect(() => {
    const walletAddress = localStorage.getItem('wallet')
    if (!walletAddress) {
      return
    }

    const userDataStr = localStorage.getItem(`wallet-${walletAddress}`)
    if (!userDataStr) {
      return
    }

    try {
      const parsed = JSON.parse(userDataStr)
      setUserData(parsed)
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    // Trigger animation on mount
    const timeout = setTimeout(() => {
      setShowBlocks(true)
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  // Extract values from localStorage or use defaults
  const numberOfTxs = userData?.HypercoreTrades
  const hypercoreVolume = userData?.HypercoreVolume
  const spotVolume = userData?.spotVolume
  const feesPaid = Math.round(userData?.gas.value * 37.5 * 100) / 100 + '$'



  const networkRank = userData?.rank
  const numberOfProjects = userData?.numberOfProtocolsUsed
  const daysActive = userData?.daysSinceFirstActivity

  // Counter animations with different delays - using actual data
  const countTxs = useCountAnimation(numberOfTxs || 0, 1000, 300)
  const countProjects = useCountAnimation(numberOfProjects || 0, 800, 1100)
  const countDaysActive = useCountAnimation(daysActive || 0, 1000, 300)

  // Determine avatar image source
  const { avatarImageSrc, isExternalUrl } = useMemo(() => {
    const avatar = userData?.avatar

    if (!avatar) {
      return { avatarImageSrc: AnimeImage, isExternalUrl: false }
    }

    // Check if avatar is a URL (starts with http:// or https://)
    if (typeof avatar === 'string' && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
      return { avatarImageSrc: avatar, isExternalUrl: true }
    }

    // Check if avatar is a key in DEFAULT_AVATAR
    if (typeof avatar === 'string' && avatar in DEFAULT_AVATAR) {
      return { avatarImageSrc: DEFAULT_AVATAR[avatar as keyof typeof DEFAULT_AVATAR], isExternalUrl: false }
    }

    // Fallback to default anime image
    return { avatarImageSrc: AnimeImage, isExternalUrl: false }
  }, [userData?.avatar])

  const blockBaseClass = 'transition-all duration-700 ease-out'
  const hiddenClass = 'opacity-0 scale-95 translate-y-4'
  const visibleClass = 'opacity-100 scale-100 translate-y-0'

  return (
    <div className="w-full h-auto grid grid-cols-4 grid-rows-4 gap-5">
      {/* block1 - spans 2 cols and 3 rows */}
      <div
        className={cn(
          'col-span-2 row-span-3 bg-rgba150-60-229-210 border border-rgba255-300 rounded-4xl overflow-hidden relative',
          blockBaseClass,
          showBlocks ? visibleClass : hiddenClass,
        )}
        style={{ transitionDelay: '0ms' }}
      >
        {isExternalUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarImageSrc as string}
            alt="avatar-image"
            className={cn(
              'w-full h-full object-cover transition-transform duration-1000 ease-out',
              showBlocks ? 'scale-100' : 'scale-110',
            )}
          />
        ) : (
          <Image
            src={avatarImageSrc}
            fill
            alt="avatar-image"
            className={cn(
              'object-cover transition-transform duration-1000 ease-out',
              showBlocks ? 'scale-100' : 'scale-110',
            )}
          />
        )}
      </div>

      {/* block2 */}
      <div
        className={cn(
          COLUMN_CLASS,
          'col-span-2',
          blockBaseClass,
          showBlocks ? visibleClass : hiddenClass,
        )}
        style={{ transitionDelay: '100ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Number of TXS</p>
        <p className="text-5xl font-bold flex items-center gap-2 mt-auto">
          {numberOfTxs ? countTxs.toLocaleString() : '-'}{' '}
          <span className="text-3xl font-medium">
            {userData?.NonceRank
              ? `#${userData.NonceRank.value.toLocaleString()} (top ${userData.NonceRank.percentage}%)`
              : '#61,154 (top 15%)'}
          </span>
        </p>
      </div>

      {/* block4 */}
      <div
        className={cn(COLUMN_CLASS, blockBaseClass, showBlocks ? visibleClass : hiddenClass)}
        style={{ transitionDelay: '200ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Hypercore volume</p>
        <p className="text-5xl font-bold mt-auto">{hypercoreVolume ? hypercoreVolume.toLocaleString() : '-'}</p>
      </div>

      {/* block5 */}
      <div
        className={cn(COLUMN_CLASS, blockBaseClass, showBlocks ? visibleClass : hiddenClass)}
        style={{ transitionDelay: '300ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Spot volume</p>
        <p className="text-5xl font-bold mt-auto">{spotVolume ? spotVolume.toLocaleString() : '-'}</p>
      </div>

      {/* block6 */}
      <div
        className={cn(
          COLUMN_CLASS,
          'col-span-2',
          blockBaseClass,
          showBlocks ? visibleClass : hiddenClass,
        )}
        style={{ transitionDelay: '400ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Fees paid</p>
        <p className="text-5xl font-bold flex items-center gap-2 mt-auto">
          {feesPaid ? feesPaid.toLocaleString() : '-'}
          <span className="text-3xl font-semibold">
            {userData?.gas?.rank?.rank != null
              ? `#${userData.gas.rank.rank.toLocaleString()} (top ${(100 - userData.gas.rank.percentile).toFixed(2)} %)`
              : '#61,154 (top 15%)'}
          </span>
        </p>
      </div>

      {/* block8 */}
      <div
        className={cn(COLUMN_CLASS, blockBaseClass, showBlocks ? visibleClass : hiddenClass)}
        style={{ transitionDelay: '500ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Network rank</p>
        <p className="text-3xl font-semibold flex flex-wrap mt-auto">
          {networkRank ? `#${networkRank.toLocaleString()}` : '#'}{' '}
          <span className="text-2xl">
            {userData?.NonceRank
              ? `(top ${userData.NonceRank.percentage}%)`
              : '(top 15%)'}
          </span>
        </p>
      </div>

      {/* block9 - spans 2 cols */}
      <div
        className={cn(
          COLUMN_CLASS,
          'col-span-2 bg-rgba0-240-255-470',
          blockBaseClass,
          showBlocks ? visibleClass : hiddenClass,
        )}
        style={{ transitionDelay: '600ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Number of project used</p>
        <p className="text-5xl font-bold flex items-center gap-2 mt-auto">
          {numberOfProjects ? countProjects : '-'}{' '}
          {/* <span className="text-4xl font-semibold">
            {userData?.NonceRank
              ? `#${userData.NonceRank.value.toLocaleString()} (top ${userData.NonceRank.percentage}%)`
              : '#61,154 (top 15%)'}
          </span> */}
        </p>
      </div>

      {/* block10 */}
      <div
        className={cn(COLUMN_CLASS, blockBaseClass, showBlocks ? visibleClass : hiddenClass)}
        style={{ transitionDelay: '700ms' }}
      >
        <p className="text-xl font-medium text-rgba255-500">Days active</p>
        <p className="text-5xl font-bold mt-auto">{daysActive ? countDaysActive.toLocaleString() : '-'}</p>
      </div>
    </div>
  )
}

export default GridAchievements
