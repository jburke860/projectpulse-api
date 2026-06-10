import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  getApiDocsUrl,
  getStoredDemoSessionId,
  setStoredDemoSessionId,
} from '../api/client'
import { createDemoSession, resetDemoSession } from '../api/queries'
import { DemoSessionContext } from './DemoSessionContext'

interface DemoSessionProviderProps {
  children: ReactNode
}

export function DemoSessionProvider({ children }: DemoSessionProviderProps) {
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState(() => getStoredDemoSessionId() ?? '')
  const [isStarting, setIsStarting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiDocsUrl = getApiDocsUrl()

  const storeSession = useCallback(
    (nextSessionId: string) => {
      setStoredDemoSessionId(nextSessionId)
      setSessionId(nextSessionId)
      queryClient.clear()
    },
    [queryClient],
  )

  const startDemo = useCallback(async () => {
    setIsStarting(true)
    setError(null)

    try {
      const session = await createDemoSession()
      storeSession(session.sessionId)
    } catch {
      setError('Could not start the demo session. Check the API deployment URL and try again.')
    } finally {
      setIsStarting(false)
    }
  }, [storeSession])

  const resetDemo = useCallback(async () => {
    if (!sessionId) {
      await startDemo()
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      const session = await resetDemoSession(sessionId)
      storeSession(session.sessionId)
    } catch {
      setError('Could not reset the demo session. Try again in a moment.')
    } finally {
      setIsResetting(false)
    }
  }, [sessionId, startDemo, storeSession])

  const value = useMemo(
    () => ({ apiDocsUrl, isResetting, resetDemo, sessionId }),
    [apiDocsUrl, isResetting, resetDemo, sessionId],
  )

  if (!sessionId) {
    return (
      <DemoStartScreen
        apiDocsUrl={apiDocsUrl}
        error={error}
        isStarting={isStarting}
        onStart={startDemo}
      />
    )
  }

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>
}

interface DemoStartScreenProps {
  apiDocsUrl: string
  error: string | null
  isStarting: boolean
  onStart: () => void
}

function DemoStartScreen({ apiDocsUrl, error, isStarting, onStart }: DemoStartScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-[#5b1714] bg-[#230907]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
        <img
          src="/projectpulse-logo-horizontal.svg"
          alt="ProjectPulse"
          className="h-14 w-auto drop-shadow-[0_8px_24px_rgba(255,102,0,0.3)]"
        />
        <h1 className="mt-8 text-3xl font-bold text-[#fff6f2]">ProjectPulse Demo</h1>
        <p className="mt-3 text-sm leading-6 text-[#d8a290]">
          Start a temporary workspace for this browser with seeded projects, tasks, members,
          and activity.
        </p>

        {error && (
          <p className="mt-5 rounded-lg border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-2 text-sm text-[#ffd1c4]">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isStarting}
            onClick={onStart}
            className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? 'Starting...' : 'Continue as Demo User'}
          </button>
          <a
            href={apiDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[#ff7b22]/35 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10"
          >
            View API Docs
          </a>
        </div>
      </section>
    </main>
  )
}
