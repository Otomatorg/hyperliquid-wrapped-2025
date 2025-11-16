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
        ? `#${userData.gas.rank.rank.toLocaleString()} (top ${userData.gas.rank.percentile ?? 'N/A'} %)`
        : 'N/A',
    },
    {
      title: 'Nonce Rank',
      description: userData?.nonce?.rank?.rank != null
        ? `#${userData.nonce.rank.rank.toLocaleString()} (top ${userData.nonce.rank.percentile ?? 'N/A'} %)`
        : 'N/A',
    },
    {
      title: 'Early Rank',
      description: userData?.EarlyRank?.rank != null
        ? `#${userData.EarlyRank.rank.toLocaleString()} (top ${userData.EarlyRank.percentile ?? 'N/A'} %)`
        : 'N/A',
    },
  ]

  return (
    <div className="flex items-center gap-4">
      {RANKS.map((rank) => (
        <div
          key={rank.title}
          className="flex-1 flex flex-col gap-4 p-6 rounded-4xl border border-rgba255-300 bg-rgba80-210-193-170 backdrop-blur-[1.5rem]"
        >
          <p className="text-center text-xl font-medium">{rank.title}</p>
          <p className="text-center text-2xl text-cyan-50d leading-12 font-bold">
            {rank.description}
          </p>
        </div>
      ))}
    </div>
  )
}

export default TextAchievementsRanks
