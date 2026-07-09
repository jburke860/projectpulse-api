import { createContext, useContext } from 'react'

export interface DemoSessionContextValue {
  apiDocsUrl: string
  clearCurrentSession: () => void
  isStartingSession: boolean
  sessionId: string
  /** Session user's id; empty for sessions stored before this field existed. */
  userId: string
  /** ISO expiry of the demo session, if known. */
  expiresAtUtc: string | null
  startNewSession: () => Promise<boolean>
}

export const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

export function useDemoSession() {
  const context = useContext(DemoSessionContext)

  if (!context) {
    throw new Error('useDemoSession must be used within DemoSessionProvider.')
  }

  return context
}
