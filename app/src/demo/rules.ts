export function periodPhrase(period: string) {
  return `Cliques, entradas e saídas dos últimos ${period} dias.`
}

export function entryPercent(clicks: number, entries: number) {
  if (!clicks) return 0
  return Math.round((entries / clicks) * 100)
}

export function calculatedFull(participants: number, limit: number) {
  return limit > 0 && participants >= limit
}

/** Cheio no filtro considera o manual e o calculado. Nenhum dos dois sozinho esconde o outro. */
export function countsAsFull(manual: boolean, calculated: boolean) {
  return manual || calculated
}

export function sortByUpdated<T extends { updatedAt?: string; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
}
