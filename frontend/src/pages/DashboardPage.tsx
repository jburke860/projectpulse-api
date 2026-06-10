import { Link } from 'react-router-dom'
import { useDashboard } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { StatCard } from '../components/StatCard'
import { useDemoSession } from '../demo/DemoSessionContext'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()
  const { apiDocsUrl } = useDemoSession()

  if (isLoading) return <p className="text-[#d8a290]">Loading dashboard…</p>
  if (error) return <p className="text-[#ff8d7d]">Could not load dashboard. Check the API deployment URL.</p>
  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#5b1714] bg-[linear-gradient(135deg,rgba(255,122,34,0.14),rgba(217,45,32,0.05),rgba(35,9,7,0.92))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
        <h2 className="text-2xl font-bold text-[#fff6f2]">Dashboard</h2>
        <p className="mt-1 text-[#d8a290]">Overview of projects and tasks across the workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={data.totalProjects} accent="ember" />
        <StatCard label="Open tasks" value={data.openTasks} accent="amber" />
        <StatCard label="Completed tasks" value={data.completedTasks} accent="sunset" />
        <StatCard label="Overdue tasks" value={data.overdueTasks} accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#fff6f2]">Recent activity</h3>
            <Link to="/activity" className="text-sm text-[#ffb15f] hover:text-[#ffd2b3]">
              View all
            </Link>
          </div>
          <ActivityFeed items={data.recentActivity} compact />
        </section>

        <section className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
          <h3 className="font-semibold text-[#fff6f2]">Quick start</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#e0b8a8]">
            <li>1. Browse seeded projects on the Projects page.</li>
            <li>2. Open a project to view tasks and members.</li>
            <li>3. Click a task to assign, change status, or comment.</li>
            <li>4. Open Swagger for raw API exploration.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/projects"
              className="inline-block rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e]"
            >
              View projects
            </Link>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-lg border border-[#ff7b22]/35 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10"
            >
              API Docs
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
