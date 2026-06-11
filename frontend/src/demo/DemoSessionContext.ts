import { createContext, useContext } from 'react'

export interface DemoSessionContextValue {
  apiDocsUrl: string
  clearCurrentSession: () => void
  sessionId: string
}

export const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

export function useDemoSession() {
  const context = useContext(DemoSessionContext)

  if (!context) {
    throw new Error('useDemoSession must be used within DemoSessionProvider.')
  }

  return context
}
