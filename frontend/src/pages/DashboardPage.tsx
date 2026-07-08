import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  SquareCheck,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDashboard } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { DashboardSkeleton } from '../components/Skeleton'
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

  if (isLoading) return <DashboardSkeleton />
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
      <section className="pp-hero-card relative overflow-hidden p-6 sm:p-8">
        <svg
          className="pointer-events-none absolute right-8 top-1/2 hidden h-20 w-72 -translate-y-1/2 sm:block"
          viewBox="0 0 288 80"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="pp-pulse-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ff7b22" stopOpacity="0" />
              <stop offset="0.35" stopColor="#ff7b22" stopOpacity="0.55" />
              <stop offset="0.75" stopColor="#ffb347" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffb347" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path
            d="M2 40 H96 l10 -12 l10 12 h28 l12 -28 l14 50 l12 -36 l8 14 h94"
            stroke="url(#pp-pulse-stroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
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
            <span className="pp-icon-tile h-16 w-16">
              <LayoutGrid className="h-7 w-7" aria-hidden />
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={data.totalProjects} hint="All time" accent="ember" icon={FolderKanban} />
        <StatCard label="Open tasks" value={data.openTasks} hint="Needs attention" accent="amber" icon={SquareCheck} />
        <StatCard label="Completed tasks" value={data.completedTasks} hint="All caught up" accent="sunset" icon={CheckCircle2} />
        <StatCard
          label="Overdue tasks"
          value={data.overdueTasks}
          hint={data.overdueTasks === 0 ? 'Great job!' : 'Past due'}
          accent="rose"
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#ffb36c]" aria-hidden />
              <h2 className="text-lg font-bold text-[#f8fafc]">Recent activity</h2>
            </div>
            <Link to="/activity" className="text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]">
              View all
            </Link>
          </div>
          <ActivityFeed items={data.recentActivity} compact />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            <h2 className="text-lg font-bold text-[#f8fafc]">Quick start</h2>
          </div>
          <p className="mt-2 text-sm text-[#a9b1c0]">Get up and running in minutes.</p>
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
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="pp-button-secondary"
            >
              API Docs
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}
