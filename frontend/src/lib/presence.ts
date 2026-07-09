export type Presence = 'online' | 'away' | 'offline'

export const presenceTone: Record<Presence, { dot: string; label: string }> = {
  online: { dot: '#22c55e', label: 'Online' },
  away: { dot: '#f59e0b', label: 'Away' },
  offline: { dot: '#64748b', label: 'Offline' },
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Deterministic demo presence: stable per user id, purely cosmetic.
 * The current session user always reads as online.
 */
export function presenceFor(userId: string, currentUserId?: string): Presence {
  if (currentUserId && userId === currentUserId) return 'online'
  const bucket = hashString(userId) % 4
  if (bucket <= 1) return 'online'
  if (bucket === 2) return 'away'
  return 'offline'
}
