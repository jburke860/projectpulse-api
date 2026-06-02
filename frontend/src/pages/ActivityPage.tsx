import { useActivity } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'

export function ActivityPage() {
  const { data: activity = [], isLoading, error } = useActivity()

  if (isLoading) return <p className="text-slate-400">Loading activity…</p>
  if (error) return <p className="text-rose-400">Failed to load activity log.</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Activity log</h2>
        <p className="mt-1 text-slate-400">Audit history for tasks, assignments, and comments.</p>
      </div>
      <ActivityFeed items={activity} />
    </div>
  )
}
