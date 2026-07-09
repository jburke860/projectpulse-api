import { ArrowUpRight, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AuditLog } from '../api/types'
import { EmptyState } from './EmptyState'
import { Badge } from './ui'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function actionLabel(action: string) {
  return action.replace(/([A-Z])/g, ' $1').trim()
}

interface ActivityFeedProps {
  items: AuditLog[]
  emptyMessage?: string
  compact?: boolean
}

export function ActivityFeed({ items, emptyMessage = 'No activity yet.', compact }: ActivityFeedProps) {
  const navigate = useNavigate()

  if (!items.length) {
    if (compact) {
      return <p className="text-sm text-[#8e99ad]">{emptyMessage}</p>
    }

    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Workspace events like task updates, assignments, and comments will appear here."
      />
    )
  }

  const jumpTo = (item: AuditLog) => {
    if (item.taskId) {
      navigate(
        `/projects/${item.projectId}?taskId=${item.taskId}`,
        item.action === 'CommentAdded'
          ? { state: { focusComment: { taskId: item.taskId, actorId: item.actorId, atUtc: item.createdAtUtc } } }
          : undefined,
      )
      return
    }

    navigate(`/projects/${item.projectId}`)
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => jumpTo(item)}
            aria-label={`Jump to ${item.taskId ? 'task' : 'project'} for: ${item.message}`}
            className={`pp-card pp-card-hover block w-full text-left ${compact ? 'p-3' : 'p-4'}`}
          >
            <div className="flex gap-3">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff7b22] shadow-[0_0_8px_rgba(255,123,34,0.8)]"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="orange">{actionLabel(item.action)}</Badge>
                  <span className="text-xs text-[#8e99ad]">{formatTime(item.createdAtUtc)}</span>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-6 text-[#f8fafc]">
                  <span className="min-w-0 flex-1">{item.message}</span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb36c]" aria-hidden />
                </p>
                <p className="mt-1 text-xs text-[#8e99ad]">
                  {item.entityType} · by {item.actorName}
                </p>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
