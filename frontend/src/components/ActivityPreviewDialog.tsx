import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTask, useTaskComments } from '../api/queries'
import type { AuditLog, Comment } from '../api/types'
import { actionLabel, isCommentActivity } from '../lib/activity'
import { formatActivityTime, formatShortDate } from '../lib/dates'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { Badge } from './ui'

function formatDueDate(date: string | null) {
  return date ? formatShortDate(date) : 'No due date'
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

interface ActivityPreviewDialogProps {
  item: AuditLog | null
  onClose: () => void
}

export function ActivityPreviewDialog({ item, onClose }: ActivityPreviewDialogProps) {
  const navigate = useNavigate()
  const taskId = item?.taskId ?? null
  const { data: task, isLoading: isTaskLoading } = useTask(taskId)
  const { data: comments = [] } = useTaskComments(taskId)
  const selectedComment = item ? findActivityComment(item, comments) : null
  useEscapeToClose(onClose, item !== null)

  if (!item) return null

  const jumpTo = () => {
    onClose()

    if (item.taskId) {
      navigate(
        `/projects/${item.projectId}?taskId=${item.taskId}`,
        isCommentActivity(item)
          ? { state: { focusComment: { taskId: item.taskId, actorId: item.actorId, atUtc: item.createdAtUtc } } }
          : undefined,
      )
      return
    }

    navigate(`/projects/${item.projectId}`)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close activity details"
        onClick={onClose}
      />
      <aside className="pp-card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pp-divider pb-4">
          <div>
            <p className="text-xs text-[#8e99ad]">{formatActivityTime(item.createdAtUtc)}</p>
            <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">{actionLabel(item.action)}</h2>
          </div>
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm leading-6 text-[#f8fafc]">{item.message}</p>
            <p className="mt-1 text-xs text-[#8e99ad]">
              {item.actorName} · {item.entityType}
            </p>
          </div>

          {taskId ? (
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
                  {isCommentActivity(item) && (
                    <div className="rounded-xl border border-[#ff7b22]/25 bg-[#ff7b22]/[0.045] p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#ffb36c]">Comment</p>
                      <p className="mt-2 text-sm leading-6 text-[#f8fafc]">
                        {selectedComment?.body ?? 'Comment text is unavailable.'}
                      </p>
                    </div>
                  )}
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

          <button type="button" className="pp-button-primary w-full" onClick={jumpTo}>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            {taskId ? (isCommentActivity(item) ? 'Jump to comment' : 'Jump to task') : 'Jump to project'}
          </button>
        </div>
      </aside>
    </>
  )
}
