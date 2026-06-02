import type { AuditLog } from '../api/types'

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
  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-lg border border-slate-800 bg-slate-900/50 ${compact ? 'p-3' : 'p-4'}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-indigo-300">
              {actionLabel(item.action)}
            </span>
            <span className="text-xs text-slate-500">{formatTime(item.createdAtUtc)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-200">{item.message}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.actorName} · {item.entityType}
          </p>
        </li>
      ))}
    </ul>
  )
}
