import { useActivity } from '../api/queries'
import { ActivityFeed } from '../components/ActivityFeed'
import { Card, PageHeader } from '../components/ui'

export function ActivityPage() {
  const { data: activity = [], isLoading, error } = useActivity()

  if (isLoading) return <p className="pp-subtitle">Loading activity...</p>
  if (error) return <p className="text-sm font-medium text-[#fecaca]">Failed to load activity log.</p>

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Workspace"
        title="Activity log"
        description="Audit history for tasks, assignments, project changes, and comments."
      />
      <Card className="p-5 sm:p-6">
        <ActivityFeed items={activity} />
      </Card>
    </div>
  )
}
