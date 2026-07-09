import { useState } from 'react'
import { ExternalLink, KeyRound, LifeBuoy, TriangleAlert } from 'lucide-react'
import { useDashboard } from '../api/queries'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Card, PageHeader } from '../components/ui'
import { useDemoSession } from '../demo/DemoSessionContext'
import { DEMO_SESSION_TEMPORARY_COPY } from '../demo/sessionConfig'

function truncateId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id
}

function describeExpiry(expiresAtUtc: string | null, now: Date) {
  if (!expiresAtUtc) return 'Unknown (older session)'
  const remainingMs = new Date(expiresAtUtc).getTime() - now.getTime()
  if (remainingMs <= 0) return 'Expired'
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.round((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  if (hours > 0) return `In about ${hours}h ${minutes}m`
  return `In about ${minutes} minutes`
}

export function SettingsPage() {
  const { apiDocsUrl, clearCurrentSession, sessionId, userId, expiresAtUtc } = useDemoSession()
  const { data: dashboard } = useDashboard()
  const [now] = useState(() => new Date())
  const [showClearDialog, setShowClearDialog] = useState(false)

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Session details, workspace info, and resources."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            <h2 className="text-lg font-bold text-[#f8fafc]">Demo Session</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#8e99ad]">{DEMO_SESSION_TEMPORARY_COPY}</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Session ID', truncateId(sessionId)],
              ['User ID', userId ? truncateId(userId) : 'Unknown (older session)'],
              ['Expires', describeExpiry(expiresAtUtc, now)],
              ['Signed in as', 'Demo User (demo@projectpulse.io)'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-[#8e99ad]">{label}</dt>
                <dd className="truncate font-mono text-xs font-semibold text-[#f8fafc]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            <h2 className="text-lg font-bold text-[#f8fafc]">Workspace and Resources</h2>
          </div>
          {dashboard && (
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Projects', dashboard.totalProjects],
                ['Tasks', dashboard.totalTasks],
                ['Team members', dashboard.teamMemberCount],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-[#8e99ad]">{label}</dt>
                  <dd className="font-semibold text-[#f8fafc]">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-5 flex flex-wrap gap-3 border-t pp-divider pt-4">
            <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="pp-button-secondary min-h-0 px-3 py-2 text-sm">
              API Docs
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <a
              href="https://github.com/jburke860/projectpulse-api"
              target="_blank"
              rel="noreferrer"
              className="pp-button-secondary min-h-0 px-3 py-2 text-sm"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </Card>
      </div>

      <Card className="border-[#f87171]/25 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-[#fca5a5]" aria-hidden />
          <h2 className="text-lg font-bold text-[#f8fafc]">Danger Zone</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8e99ad]">
          Clearing the session discards this browser's demo workspace. A fresh session reseeds
          projects, tasks, members, and files.
        </p>
        <button
          type="button"
          onClick={() => setShowClearDialog(true)}
          className="pp-button-danger mt-4"
        >
          Clear and start new session
        </button>
      </Card>

      <ConfirmDialog
        open={showClearDialog}
        title="Clear this demo session?"
        description="Your current workspace, including anything you created or uploaded, will be discarded."
        confirmLabel="Clear session"
        onCancel={() => setShowClearDialog(false)}
        onConfirm={clearCurrentSession}
      />
    </div>
  )
}
