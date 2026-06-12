import { Link, useNavigate } from 'react-router-dom'
import { useDashboard } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { StatCard } from '../components/StatCard'
import { Button, Card } from '../components/ui'
import { useDemoSession } from '../demo/DemoSessionContext'
import { DEMO_SESSION_TEMPORARY_COPY } from '../demo/sessionConfig'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()
  const { apiDocsUrl, isStartingSession, startNewSession } = useDemoSession()
  const navigate = useNavigate()

  const handleStartNewSession = async () => {
    const didStart = await startNewSession()
    if (didStart) {
      navigate('/', { replace: true })
    }
  }

  if (isLoading) return <p className="pp-subtitle">Loading dashboard...</p>
  if (error) return <p className="text-sm font-medium text-[#fecaca]">Could not load dashboard. Check the API deployment URL.</p>
  if (!data) return null
  if (data.totalProjects === 0) {
    return (
      <Card className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-[#f8fafc]">Demo session expired</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a9b1c0]">
          This temporary demo session expired because the free hosted backend restarted. Start a fresh
          session to reload sample projects.
        </p>
        <Button
          type="button"
          disabled={isStartingSession}
          onClick={handleStartNewSession}
          className="mt-6"
        >
          {isStartingSession ? 'Starting...' : 'Start New Session'}
        </Button>
      </Card>
    )
  }

  return (
    <div className="pp-page-shell">
      <section className="pp-hero-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-normal text-[#f8fafc] sm:text-3xl">
              Welcome back, Demo User!
            </h1>
            <p className="mt-2 max-w-2xl text-[#cbd5e1]">
              Here's what's happening across your ProjectPulse workspace.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8e99ad]">
              {DEMO_SESSION_TEMPORARY_COPY}
            </p>
          </div>
          <div className="hidden sm:flex">
            <span className="pp-icon-tile h-16 w-16 text-xl font-black">PP</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={data.totalProjects} hint="All time" accent="ember" />
        <StatCard label="Open tasks" value={data.openTasks} hint="Needs attention" accent="amber" />
        <StatCard label="Completed tasks" value={data.completedTasks} hint="All caught up" accent="sunset" />
        <StatCard label="Overdue tasks" value={data.overdueTasks} hint="Past due" accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="pp-eyebrow">Latest</p>
              <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Recent activity</h2>
            </div>
            <Link to="/activity" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
              View all
            </Link>
          </div>
          <ActivityFeed items={data.recentActivity} compact />
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="pp-eyebrow">Guide</p>
          <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Quick start</h2>
          <p className="mt-2 text-sm text-[#a9b1c0]">Explore the seeded workspace in a few focused steps.</p>
          <ul className="mt-5 space-y-4 text-sm text-[#cbd5e1]">
            {[
              ['Browse projects', 'Review the workspace portfolio and task volume.'],
              ['Open a project', 'Inspect tasks, members, project progress, and activity.'],
              ['Take action', 'Assign tasks, update status, or leave a comment.'],
              ['Integrate', 'Use the API docs to inspect available endpoints.'],
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff7b22]/15 text-xs font-bold text-[#fed7aa] ring-1 ring-[#ff7b22]/30">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-semibold text-[#f8fafc]">{title}</span>
                  <span className="text-[#8e99ad]">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="pp-button-primary"
            >
              View projects
            </Link>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="pp-button-secondary"
            >
              API Docs
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}
