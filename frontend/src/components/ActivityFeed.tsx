import { useState } from 'react'
import { useTask, useTaskComments } from '../api/queries'
import type { AuditLog, Comment } from '../api/types'
import { Badge } from './ui'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function actionLabel(action: string) {
  return action.replace(/([A-Z])/g, ' $1').trim()
}

function formatDueDate(date: string | null) {
  if (!date) return 'No due date'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function isCommentActivity(item: AuditLog) {
  return item.action === 'CommentAdded'
}

function findActivityComment(item: AuditLog, comments: Comment[]) {
  if (!isCommentActivity(item) || !comments.length) return null

  const activityTime = new Date(item.createdAtUtc).getTime()
  const sameAuthorComments = comments.filter((comment) => comment.authorId === item.actorId)
  const candidates = sameAuthorComments.length ? sameAuthorComments : comments

  return [...candidates].sort(
    (a, b) =>
      Math.abs(new Date(a.createdAtUtc).getTime() - activityTime) -
      Math.abs(new Date(b.createdAtUtc).getTime() - activityTime),
  )[0]
}

interface ActivityFeedProps {
  items: AuditLog[]
  emptyMessage?: string
  compact?: boolean
}

export function ActivityFeed({ items, emptyMessage = 'No activity yet.', compact }: ActivityFeedProps) {
  const [selectedItem, setSelectedItem] = useState<AuditLog | null>(null)
  const selectedTaskId = selectedItem?.taskId ?? null
  const { data: task, isLoading: isTaskLoading } = useTask(selectedTaskId)
  const { data: comments = [] } = useTaskComments(selectedTaskId)
  const selectedComment = selectedItem ? findActivityComment(selectedItem, comments) : null

  if (!items.length) {
    return <p className="text-sm text-[#8e99ad]">{emptyMessage}</p>
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
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff7b22] shadow-[0_0_8px_rgba(255,123,34,0.8)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="orange">{actionLabel(item.action)}</Badge>
                    <span className="text-xs text-[#8e99ad]">{formatTime(item.createdAtUtc)}</span>
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

      {selectedItem && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
            aria-label="Close activity details"
            onClick={() => setSelectedItem(null)}
          />
          <aside className="pp-card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b pp-divider pb-4">
              <div>
                <p className="text-xs text-[#8e99ad]">{formatTime(selectedItem.createdAtUtc)}</p>
                <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">
                  {actionLabel(selectedItem.action)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="pp-button-ghost min-h-0 px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm leading-6 text-[#f8fafc]">{selectedItem.message}</p>
                <p className="mt-1 text-xs text-[#8e99ad]">
                  {selectedItem.actorName} · {selectedItem.entityType}
                </p>
              </div>

              {selectedTaskId ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  {isTaskLoading ? (
                    <p className="text-sm text-[#a9b1c0]">Loading task details...</p>
                  ) : task ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[#f8fafc]">{task.title}</h3>
                          <p className="mt-1 text-xs text-[#8e99ad]">
                            Assigned to {task.assigneeName ?? 'Unassigned'} · {task.priority} ·{' '}
                            {task.dueDateUtc ? `Due ${formatDueDate(task.dueDateUtc)}` : 'No due date'}
                          </p>
                        </div>
                        <Badge tone="orange">{task.status}</Badge>
                      </div>
                      <p className="line-clamp-3 text-sm leading-6 text-[#a9b1c0]">
                        {task.description || 'No description yet'}
                      </p>
                      {isCommentActivity(selectedItem) && (
                        <div className="rounded-xl border border-[#ff7b22]/25 bg-[#ff7b22]/[0.045] p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#ffb36c]">Comment</p>
                          <p className="mt-2 text-sm leading-6 text-[#f8fafc]">
                            {selectedComment?.body ?? 'Comment text is unavailable.'}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-[#8e99ad]">
                        {comments.length} comment{comments.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#fecaca]">Task details are unavailable.</p>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-[#a9b1c0]">
                  This activity is project-level and is not attached to a task.
                </p>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
