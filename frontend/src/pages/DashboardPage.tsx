import { Link } from 'react-router-dom'
import { useDashboard } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { StatCard } from '../components/StatCard'

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <p className="text-slate-400">Loading dashboard…</p>
  if (error) return <p className="text-rose-400">Could not load dashboard. Is the API running on port 5000?</p>
  if (!data) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-slate-400">Overview of projects and tasks across the workspace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={data.totalProjects} accent="indigo" />
        <StatCard label="Open tasks" value={data.openTasks} accent="amber" />
        <StatCard label="Completed tasks" value={data.completedTasks} accent="emerald" />
        <StatCard label="Overdue tasks" value={data.overdueTasks} accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent activity</h3>
            <Link to="/activity" className="text-sm text-indigo-400 hover:text-indigo-300">
              View all
            </Link>
          </div>
          <ActivityFeed items={data.recentActivity} compact />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="font-semibold text-white">Quick start</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>1. Browse seeded projects on the Projects page.</li>
            <li>2. Open a project to view tasks and members.</li>
            <li>3. Click a task to assign, change status, or comment.</li>
            <li>4. Use Swagger at localhost:5000/swagger for raw API exploration.</li>
          </ul>
          <Link
            to="/projects"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            View projects
          </Link>
        </section>
      </div>
    </div>
  )
}
