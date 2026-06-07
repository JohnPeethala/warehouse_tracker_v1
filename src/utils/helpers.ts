export function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function sortLogs<T extends { sub_category: string | null }>(logs: T[]): T[] {
  return logs.sort((a, b) => {
    const getRank = (sub: string | null) => {
      if (!sub) return 99
      const s = sub.toLowerCase()
      if (s.includes('delivery')) return 1
      if (s.includes('pickup')) return 2
      return 3
    }
    const rA = getRank(a.sub_category)
    const rB = getRank(b.sub_category)
    if (rA !== rB) return rA - rB
    return (a.sub_category || '').localeCompare(b.sub_category || '')
  })
}
