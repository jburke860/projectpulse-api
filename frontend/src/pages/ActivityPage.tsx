import { useActivity } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'

export function ActivityPage() {
  const { data: activity = [], isLoading, error } = useActivity()

  if (isLoading) return <p className="text-[#d8a290]">Loading activity…</p>
  if (error) return <p className="text-[#ff8d7d]">Failed to load activity log.</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#fff6f2]">Activity log</h2>
        <p className="mt-1 text-[#d8a290]">Audit history for tasks, assignments, and comments.</p>
      </div>
      <ActivityFeed items={activity} />
    </div>
  )
}
