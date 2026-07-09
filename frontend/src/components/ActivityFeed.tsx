import { useState } from 'react'
import { Activity } from 'lucide-react'
import type { AuditLog } from '../api/types'
import { actionLabel } from '../lib/activity'
import { formatActivityTime } from '../lib/dates'
import { ActivityPreviewDialog } from './ActivityPreviewDialog'
import { EmptyState } from './EmptyState'
import { Badge } from './ui'

interface ActivityFeedProps {
  items: AuditLog[]
  emptyMessage?: string
  compact?: boolean
}

export function ActivityFeed({ items, emptyMessage = 'No activity yet.', compact }: ActivityFeedProps) {
  const [selectedItem, setSelectedItem] = useState<AuditLog | null>(null)

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

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
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
                    <span className="text-xs text-[#8e99ad]">{formatActivityTime(item.createdAtUtc)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#f8fafc]">{item.message}</p>
                  <p className="mt-1 text-xs text-[#8e99ad]">
                    {item.entityType} · by {item.actorName}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <ActivityPreviewDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  )
}
