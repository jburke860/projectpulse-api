import { useState } from 'react'
import { useTask, useTaskComments } from '../api/queries'
import type { AuditLog, Comment } from '../api/types'

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
    return <p className="text-sm text-[#c38f7f]">{emptyMessage}</p>
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className={`block w-full rounded-lg border border-[#5a1914] bg-[#230907]/70 text-left shadow-[0_10px_24px_rgba(0,0,0,0.2)] transition hover:border-[#ff7b22]/45 hover:bg-[#2a0d0a] ${compact ? 'p-3' : 'p-4'}`}
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
          <aside className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#5b1714] bg-[#170606] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#5b1714] pb-4">
              <div>
                <p className="text-xs text-[#c99182]">{formatTime(selectedItem.createdAtUtc)}</p>
                <h2 className="mt-1 text-lg font-semibold text-[#fff6f2]">
                  {actionLabel(selectedItem.action)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg px-2 py-1 text-sm text-[#d8a290] hover:bg-[#2b0c09] hover:text-[#fff7f2]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm leading-6 text-[#fff0e8]">{selectedItem.message}</p>
                <p className="mt-1 text-xs text-[#c58b7a]">
                  {selectedItem.actorName} · {selectedItem.entityType}
                </p>
              </div>

              {selectedTaskId ? (
                <div className="rounded-lg border border-[#5a1914] bg-[#230907]/70 p-4">
                  {isTaskLoading ? (
                    <p className="text-sm text-[#d8a290]">Loading task details...</p>
                  ) : task ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-[#fff6f2]">{task.title}</h3>
                          <p className="mt-1 text-xs text-[#c99182]">
                            Assigned to {task.assigneeName ?? 'Unassigned'} · {task.priority} ·{' '}
                            {task.dueDateUtc ? `Due ${formatDueDate(task.dueDateUtc)}` : 'No due date'}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#ff7b22]/30 bg-[#ff7b22]/12 px-2 py-0.5 text-xs text-[#ffd2b3]">
                          {task.status}
                        </span>
                      </div>
                      <p className="line-clamp-3 text-sm leading-6 text-[#d8a290]">
                        {task.description || 'No description yet'}
                      </p>
                      {isCommentActivity(selectedItem) && (
                        <div className="rounded-lg border border-[#5a1914] bg-[#1c0705] p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-[#c99182]">Comment</p>
                          <p className="mt-2 text-sm leading-6 text-[#fff0e8]">
                            {selectedComment?.body ?? 'Comment text is unavailable.'}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-[#c58b7a]">
                        {comments.length} comment{comments.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#ff8d7d]">Task details are unavailable.</p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-[#5a1914] bg-[#230907]/70 p-4 text-sm text-[#d8a290]">
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
