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
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[#5c1713] bg-[#170606] p-6 shadow-2xl">
        <p className="text-[#d8a290]">Loading task…</p>
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
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#5c1713] bg-[#170606] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#5c1713] p-4">
        <h2 className="font-semibold text-[#fff6f2]">Task detail</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-[#d8a290] hover:bg-[#2b0c09] hover:text-[#fff7f2]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {mutationError && (
          <p className="rounded-lg border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-2 text-sm text-[#ffd1c4]">
            {mutationError}
          </p>
        )}

        <div>
          <label className="text-xs text-[#c99182]">Title</label>
          <input
            className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
            value={edit.title ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs text-[#c99182]">Description</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
            rows={3}
            value={edit.description ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[#c99182]">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
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
            <label className="text-xs text-[#c99182]">Priority</label>
            <select
              className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
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
          <label className="text-xs text-[#c99182]">Due date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
            value={edit.dueDateUtc ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, dueDateUtc: e.target.value }))}
          />
        </div>

        <button
          type="button"
          disabled={updateTask.isPending}
          className="w-full rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] py-2 text-sm font-medium text-white shadow-[0_14px_30px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e] disabled:cursor-not-allowed disabled:opacity-60"
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
          {updateTask.isPending ? 'Saving…' : 'Save changes'}
        </button>

        <div>
          <label className="text-xs text-[#c99182]">Assignee</label>
          <select
            className="mt-1 w-full rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
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
          <h3 className="text-sm font-medium text-[#fff6f2]">Comments</h3>
          <ul className="mt-3 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-[#522016] bg-[#230907] p-3 text-sm">
                <p className="text-[#fff0e8]">{c.body}</p>
                <p className="mt-1 text-xs text-[#c99182]">{c.authorName}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-[#3b110d] px-3 py-2 text-sm text-[#ffd8cb] hover:bg-[#4f1610]"
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
