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
    return <p className="text-sm text-[#c38f7f]">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-lg border border-[#5a1914] bg-[#230907]/70 shadow-[0_10px_24px_rgba(0,0,0,0.2)] ${compact ? 'p-3' : 'p-4'}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#ff7b22]/30 bg-[#ff7b22]/12 px-2 py-0.5 text-xs font-medium text-[#ffc29c]">
              {actionLabel(item.action)}
            </span>
            <span className="text-xs text-[#c58b7a]">{formatTime(item.createdAtUtc)}</span>
          </div>
          <p className="mt-2 text-sm text-[#fff0e8]">{item.message}</p>
          <p className="mt-1 text-xs text-[#c58b7a]">
            {item.actorName} · {item.entityType}
          </p>
        </li>
      ))}
    </ul>
  )
}
