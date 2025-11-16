import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  // Fisher-Yates shuffle: randomly swap each item with another random position
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]]
  }
  return shuffled
}

export function getRandomItems<T extends Record<string, any>>(
  array: T[],
  count: number,
  options?: { withActive?: boolean; activeCount?: number },
): (T & { active?: boolean })[] {
  // Use smarter algorithm to avoid adjacent duplicates
  const result = shuffleWithoutAdjacentDuplicates(array, count)

  if (options?.withActive) {
    return addRandomActiveProperty(result, options.activeCount)
  }
  return result as (T & { active?: boolean })[]
}

function shuffleWithoutAdjacentDuplicates<T extends Record<string, any>>(
  array: T[],
  count: number,
): T[] {
  // Group items by name
  const groups = new Map<string, T[]>()
  for (const item of array) {
    const name = item.name
    if (!groups.has(name)) {
      groups.set(name, [])
    }
    groups.get(name)!.push(item)
  }

  // Create a pool of items to place
  const itemPool = array.slice(0, count)
  const result: T[] = []
  const available = new Map<string, T[]>()

  // Initialize available items
  for (const item of itemPool) {
    const name = item.name
    if (!available.has(name)) {
      available.set(name, [])
    }
    available.get(name)!.push(item)
  }

  // Build result array, avoiding adjacent duplicates
  for (let i = 0; i < count; i++) {
    const lastItemName = i > 0 ? result[i - 1].name : null

    // Get names that are available and different from last
    const eligibleNames = Array.from(available.keys()).filter(
      (name) => name !== lastItemName && available.get(name)!.length > 0,
    )

    if (eligibleNames.length === 0) {
      // Fallback: if no eligible names, take any available
      const allNames = Array.from(available.keys()).filter(
        (name) => available.get(name)!.length > 0,
      )
      if (allNames.length > 0) {
        const randomName = allNames[Math.floor(Math.random() * allNames.length)]
        const items = available.get(randomName)!
        const item = items.pop()!
        result.push(item)
        if (items.length === 0) available.delete(randomName)
      }
    } else {
      // Pick a random eligible name
      const randomName = eligibleNames[Math.floor(Math.random() * eligibleNames.length)]
      const items = available.get(randomName)!
      const item = items.pop()!
      result.push(item)
      if (items.length === 0) available.delete(randomName)
    }
  }

  return result
}

function addRandomActiveProperty<T extends Record<string, any>>(
  array: T[],
  activeCount?: number,
): (T & { active: boolean })[] {
  const count = activeCount ?? Math.floor(Math.random() * array.length) + 1
  const rowSize = 7
  const numRows = Math.ceil(array.length / rowSize)

  // Initialize all items as inactive
  const result = array.map((item) => ({ ...item, active: false }))
  const activeIndices: number[] = []

  // Distribute active items across rows
  const activePerRow = Math.floor(count / numRows)
  const extraActives = count % numRows

  for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
    const rowStart = rowIndex * rowSize
    const rowEnd = Math.min(rowStart + rowSize, array.length)
    const rowItems = array.slice(rowStart, rowEnd)

    // Determine how many active items for this row
    const targetActive = activePerRow + (rowIndex < extraActives ? 1 : 0)

    // Get indices of items in this row with unique names
    const usedNames = new Set<string>()
    const eligibleIndices: number[] = []

    for (let i = 0; i < rowItems.length; i++) {
      const globalIndex = rowStart + i
      const itemName = rowItems[i].name

      if (!usedNames.has(itemName)) {
        eligibleIndices.push(globalIndex)
        usedNames.add(itemName)
      }
    }

    // Randomly select from eligible indices
    const shuffledEligible = shuffleArray(eligibleIndices)
    const selectedCount = Math.min(targetActive, shuffledEligible.length)

    for (let i = 0; i < selectedCount; i++) {
      const index = shuffledEligible[i]
      activeIndices.push(index)
      result[index].active = true
    }
  }

  return result
}
