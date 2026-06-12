import { useState } from 'react'
import type { Task } from '../api/types'
import {
  useAddComment,
  useAssignTask,
  useProjectMembers,
  useTask,
  useTaskComments,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../api/queries'
import { Button } from './ui'

const statuses = ['Open', 'InProgress', 'InReview', 'Done', 'Cancelled']
const priorities = ['Low', 'Medium', 'High', 'Critical']
const allowedStatusTransitions: Record<string, string[]> = {
  Open: ['Open', 'InProgress', 'Cancelled'],
  InProgress: ['InProgress', 'InReview', 'Open', 'Cancelled'],
  InReview: ['InReview', 'Done', 'InProgress', 'Cancelled'],
  Done: ['Done'],
  Cancelled: ['Cancelled', 'Open'],
}

function isAssignableMember(role: string) {
  return role === 'Admin' || role === 'Member'
}

function getMutationErrorMessage(error: unknown) {
  if (!error) return null

  const response = (error as {
    response?: { data?: { errors?: string[]; message?: string } }
  }).response

  if (response?.data?.errors?.length) {
    return response.data.errors.join(' ')
  }

  if (response?.data?.message) {
    return response.data.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

interface TaskPanelProps {
  taskId: string
  projectId: string
  onClose: () => void
}

export function TaskPanel({ taskId, projectId, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId)

  if (isLoading || !task) {
    return (
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/10 bg-[#0a0d13] p-6 shadow-2xl">
        <p className="pp-subtitle">Loading task...</p>
      </aside>
    )
  }

  return <LoadedTaskPanel key={task.id} task={task} taskId={taskId} projectId={projectId} onClose={onClose} />
}

interface LoadedTaskPanelProps extends TaskPanelProps {
  task: Task
}

function LoadedTaskPanel({ task, taskId, projectId, onClose }: LoadedTaskPanelProps) {
  const { data: comments = [] } = useTaskComments(taskId)
  const { data: members = [] } = useProjectMembers(projectId)
  const assignableMembers = members.filter((member) => isAssignableMember(member.role))
  const updateStatus = useUpdateTaskStatus(taskId, projectId)
  const assignTask = useAssignTask(taskId, projectId)
  const updateTask = useUpdateTask(taskId, projectId)
  const addComment = useAddComment(taskId, projectId)

  const [comment, setComment] = useState('')
  const [edit, setEdit] = useState<Partial<Task>>({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDateUtc: task.dueDateUtc?.slice(0, 10) ?? '',
  })
  const allowedStatuses = allowedStatusTransitions[task.status] ?? [task.status]
  const mutationError = getMutationErrorMessage(
    updateStatus.error ?? updateTask.error ?? assignTask.error ?? addComment.error,
  )

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0a0d13] shadow-2xl">
      <div className="flex items-center justify-between border-b pp-divider p-5">
        <div>
          <p className="pp-eyebrow">Task</p>
          <h2 className="mt-1 font-bold text-[#f8fafc]">Task detail</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pp-button-ghost min-h-0 px-2 py-1"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {mutationError && (
          <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
            {mutationError}
          </p>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Title</label>
          <input
            className="pp-input mt-1 text-sm"
            value={edit.title ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Description</label>
          <textarea
            className="pp-textarea mt-1 text-sm"
            rows={3}
            value={edit.description ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Status</label>
            <select
              className="pp-select mt-1 text-sm"
              value={task.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s} disabled={!allowedStatuses.includes(s)}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Priority</label>
            <select
              className="pp-select mt-1 text-sm"
              value={edit.priority ?? task.priority}
              onChange={(e) => setEdit((s) => ({ ...s, priority: e.target.value }))}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Due date</label>
          <input
            type="date"
            className="pp-input mt-1 text-sm"
            value={edit.dueDateUtc ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, dueDateUtc: e.target.value }))}
          />
        </div>

        <Button
          type="button"
          disabled={updateTask.isPending}
          className="w-full"
          onClick={() =>
            updateTask.mutate(
              {
                title: edit.title ?? task.title,
                description: edit.description || undefined,
                priority: edit.priority ?? task.priority,
                dueDateUtc: edit.dueDateUtc ? `${edit.dueDateUtc}T00:00:00Z` : null,
              },
              { onSuccess: onClose },
            )
          }
        >
          {updateTask.isPending ? 'Saving...' : 'Save changes'}
        </Button>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Assignee</label>
          <select
            className="pp-select mt-1 text-sm"
            value={task.assigneeId ?? ''}
            onChange={(e) => assignTask.mutate(e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {assignableMembers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#f8fafc]">Comments</h3>
          <ul className="mt-3 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm">
                <p className="text-[#f8fafc]">{c.body}</p>
                <p className="mt-1 text-xs text-[#8e99ad]">{c.authorName}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className="pp-input flex-1 text-sm"
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="button"
              className="pp-button-secondary"
              onClick={() => {
                if (!comment.trim()) return
                addComment.mutate(comment, { onSuccess: () => setComment('') })
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
