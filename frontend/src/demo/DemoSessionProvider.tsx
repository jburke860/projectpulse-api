import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  clearStoredDemoSessionId,
  getApiDocsUrl,
  getStoredDemoSessionId,
  setStoredDemoSessionId,
} from '../api/client'
import { createDemoSession } from '../api/queries'
import { DemoSessionContext } from './DemoSessionContext'
import { DEMO_SESSION_LIFETIME_HOURS } from './sessionConfig'

interface DemoSessionProviderProps {
  children: ReactNode
}

export function DemoSessionProvider({ children }: DemoSessionProviderProps) {
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState(() => getStoredDemoSessionId() ?? '')
  const [hasEnteredSession, setHasEnteredSession] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiDocsUrl = getApiDocsUrl()

  const refreshToDemoLanding = useCallback(() => {
    window.location.replace('/')
  }, [])

  const storeSession = useCallback(
    (nextSessionId: string) => {
      setStoredDemoSessionId(nextSessionId)
      setSessionId(nextSessionId)
      queryClient.clear()
    },
    [queryClient],
  )

  const startNewSession = useCallback(async () => {
    setIsStarting(true)
    setError(null)
    clearStoredDemoSessionId()
    setSessionId('')
    queryClient.clear()

    try {
      const session = await createDemoSession()
      storeSession(session.sessionId)
      setHasEnteredSession(true)
    } catch {
      setError('Could not start the demo session. Check the API deployment URL and try again.')
    } finally {
      setIsStarting(false)
    }
  }, [queryClient, storeSession])

  const resumeDemo = useCallback(() => {
    setError(null)
    setHasEnteredSession(true)
  }, [])

  const clearCurrentSession = useCallback(() => {
    setError(null)
    clearStoredDemoSessionId()
    setSessionId('')
    setHasEnteredSession(false)
    queryClient.clear()
    refreshToDemoLanding()
  }, [queryClient, refreshToDemoLanding])

  const value = useMemo(
    () => ({ apiDocsUrl, clearCurrentSession, sessionId }),
    [apiDocsUrl, clearCurrentSession, sessionId],
  )

  if (!sessionId || !hasEnteredSession) {
    return (
      <DemoStartScreen
        error={error}
        hasExistingSession={!!sessionId}
        isStarting={isStarting}
        onResume={resumeDemo}
        onStartNew={startNewSession}
      />
    )
  }

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>
}

interface DemoStartScreenProps {
  error: string | null
  hasExistingSession: boolean
  isStarting: boolean
  onResume: () => void
  onStartNew: () => void
}

function DemoStartScreen({
  error,
  hasExistingSession,
  isStarting,
  onResume,
  onStartNew,
}: DemoStartScreenProps) {
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
          {hasExistingSession
            ? 'Resume the workspace already stored in this browser, or start fresh with a new session.'
            : 'Start a temporary workspace for this browser with realistic projects, tasks, members, and activity.'}
        </p>
        <p className="mt-4 text-xs leading-5 text-[#b88172]">
          Sessions are saved for up to {DEMO_SESSION_LIFETIME_HOURS} hours due to temporary demo storage.
        </p>

        {error && (
          <p className="mt-5 rounded-lg border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-2 text-sm text-[#ffd1c4]">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {hasExistingSession ? (
            <>
              <button
                type="button"
                onClick={onResume}
                className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e]"
              >
                Resume Current Session
              </button>
              <button
                type="button"
                disabled={isStarting}
                onClick={onStartNew}
                className="rounded-lg border border-[#ff7b22]/35 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting ? 'Starting...' : 'Start New Session'}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isStarting}
              onClick={onStartNew}
              className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting ? 'Starting...' : 'Start New Demo Session'}
            </button>
          )}
        </div>
        <p className="mt-7 text-xs text-[#9f6d61]">Created by Jeremy Burke</p>
      </section>
    </main>
  )
}
