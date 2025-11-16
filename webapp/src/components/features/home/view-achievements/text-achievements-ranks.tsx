const TextAchievementsRanks = () => {
  // Fetch data from localStorage
  const userData = (() => {
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
  })()

  const RANKS = [
    {
      title: 'Gas Rank',
      description: userData?.gas?.rank?.rank != null
        ? `#${userData.gas.rank.rank.toLocaleString()} (top ${(100 - userData.gas.rank.percentile).toFixed(2)} %)`
        : 'N/A',
    },
    {
      title: 'Nonce Rank',
      description: userData?.nonce?.rank?.rank != null
        ? `#${userData.nonce.rank.rank.toLocaleString()} (top ${(100 - userData.nonce.rank.percentile).toFixed(2)} %)`
        : 'N/A',
    },
    {
      title: 'Early Rank',
      description: userData?.EarlyRank?.rank != null
        ? `#${userData.EarlyRank.rank.toLocaleString()} (top ${(100 - userData.EarlyRank.percentile).toFixed(2)} %)`
        : 'N/A',
    },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
      {RANKS.map((rank) => (
        <div
          key={rank.title}
          className="flex-1 flex flex-col gap-2 sm:gap-3 md:gap-4 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl md:rounded-4xl border border-rgba255-300 bg-rgba80-210-193-170 backdrop-blur-[1.5rem]"
        >
          <p className="text-center text-sm sm:text-base md:text-lg lg:text-xl font-medium">{rank.title}</p>
          <p className="text-center text-base sm:text-lg md:text-xl lg:text-2xl text-cyan-50d leading-6 sm:leading-8 md:leading-10 lg:leading-12 font-bold break-words">
            {rank.description}
          </p>
        </div>
      ))}
    </div>
  )
}

export default TextAchievementsRanks
