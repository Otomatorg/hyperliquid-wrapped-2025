import { useEffect, useState } from 'react'

const useCountAnimation = (end: number, duration: number = 1000, delay: number = 0) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const startTime = Date.now() + delay
    const endTime = startTime + duration

    const updateCount = () => {
      const now = Date.now()

      if (now < startTime) {
        requestAnimationFrame(updateCount)
        return
      }

      if (now >= endTime) {
        setCount(end)
        return
      }

      const progress = (now - startTime) / duration
      const currentCount = Math.floor(progress * end)
      setCount(currentCount)
      requestAnimationFrame(updateCount)
    }

    requestAnimationFrame(updateCount)
  }, [end, duration, delay])

  return count
}

export default useCountAnimation
