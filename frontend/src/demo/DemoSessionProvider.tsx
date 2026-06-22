import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearStoredDemoSessionId,
  getApiDocsUrl,
  getStoredDemoSessionId,
  setStoredDemoSessionId,
} from '../api/client'
import { createDemoSession } from '../api/queries'
import { Button } from '../components/ui'
import { DemoSessionContext } from './DemoSessionContext'
import { DEMO_SESSION_TEMPORARY_COPY } from './sessionConfig'

const SLOW_START_DELAY_MS = 5_000
const DEMO_SESSION_SLOW_START_COPY = 'This may take a few minutes if the backend has to boot up.'

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
      return true
    } catch {
      setError('Could not start the demo session. Check the API deployment URL and try again.')
      return false
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
    () => ({ apiDocsUrl, clearCurrentSession, isStartingSession: isStarting, sessionId, startNewSession }),
    [apiDocsUrl, clearCurrentSession, isStarting, sessionId, startNewSession],
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
  const [showSlowStartMessage, setShowSlowStartMessage] = useState(false)

  useEffect(() => {
    if (!isStarting) {
      setShowSlowStartMessage(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowSlowStartMessage(true)
    }, SLOW_START_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isStarting])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="pp-card w-full max-w-xl p-6 sm:p-8">
        <img
          src="/projectpulse-logo-horizontal.svg"
          alt="ProjectPulse"
          className="h-12 w-auto drop-shadow-[0_10px_28px_rgba(255,122,34,0.22)]"
        />
        <h1 className="mt-8 text-3xl font-extrabold tracking-normal text-[#f8fafc]">ProjectPulse Demo</h1>
        <p className="mt-3 text-sm leading-6 text-[#a9b1c0]">
          {hasExistingSession
            ? 'Resume the workspace already stored in this browser, or start fresh with a new session.'
            : 'Start a temporary workspace for this browser with realistic projects, tasks, members, and activity.'}
        </p>
        <p className="mt-4 text-xs leading-5 text-[#8e99ad]">
          {DEMO_SESSION_TEMPORARY_COPY}
        </p>

        {error && (
          <p className="mt-5 rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {hasExistingSession ? (
            <>
              <Button
                type="button"
                onClick={onResume}
              >
                Resume Current Session
              </Button>
              <Button
                type="button"
                disabled={isStarting}
                onClick={onStartNew}
                variant="secondary"
              >
                {isStarting ? 'Starting...' : 'Start New Session'}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={isStarting}
              onClick={onStartNew}
            >
              {isStarting ? 'Starting...' : 'Start New Demo Session'}
            </Button>
          )}
        </div>
        {showSlowStartMessage && (
          <p
            className="mt-4 rounded-xl border border-[#ffb36c]/25 bg-[#ff7a22]/10 px-3 py-2 text-sm leading-5 text-[#fed7aa]"
            role="status"
          >
            {DEMO_SESSION_SLOW_START_COPY}
          </p>
        )}
        <p className="mt-7 text-xs text-[#687387]">Created by Jeremy Burke</p>
      </section>
    </main>
  )
}
