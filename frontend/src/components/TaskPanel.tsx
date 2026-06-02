import { useEffect, useState } from 'react'
import type { Task } from '../api/types'
import {
  useAddComment,
  useAssignTask,
  useTask,
  useTaskComments,
  useUpdateTask,
  useUpdateTaskStatus,
  useUsers,
} from '../api/queries'

const statuses = ['Open', 'InProgress', 'InReview', 'Done', 'Cancelled']
const priorities = ['Low', 'Medium', 'High', 'Critical']

interface TaskPanelProps {
  taskId: string
  projectId: string
  onClose: () => void
}

export function TaskPanel({ taskId, projectId, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId)
  const { data: comments = [] } = useTaskComments(taskId)
  const { data: users = [] } = useUsers()
  const updateStatus = useUpdateTaskStatus(taskId, projectId)
  const assignTask = useAssignTask(taskId, projectId)
  const updateTask = useUpdateTask(taskId, projectId)
  const addComment = useAddComment(taskId, projectId)

  const [comment, setComment] = useState('')
  const [edit, setEdit] = useState<Partial<Task>>({})

  useEffect(() => {
    if (task) {
      setEdit({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        dueDateUtc: task.dueDateUtc?.slice(0, 10) ?? '',
      })
    }
  }, [task])

  if (isLoading || !task) {
    return (
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <p className="text-slate-400">Loading task…</p>
      </aside>
    )
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 className="font-semibold text-white">Task detail</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <label className="text-xs text-slate-500">Title</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={edit.title ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs text-slate-500">Description</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            rows={3}
            value={edit.description ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">Status</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={task.status}
              onChange={(e) => updateStatus.mutate(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Priority</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
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
          <label className="text-xs text-slate-500">Due date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={edit.dueDateUtc ?? ''}
            onChange={(e) => setEdit((s) => ({ ...s, dueDateUtc: e.target.value }))}
          />
        </div>

        <button
          type="button"
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          onClick={() =>
            updateTask.mutate({
              title: edit.title ?? task.title,
              description: edit.description || undefined,
              priority: edit.priority ?? task.priority,
              dueDateUtc: edit.dueDateUtc ? `${edit.dueDateUtc}T00:00:00Z` : null,
            })
          }
        >
          Save changes
        </button>

        <div>
          <label className="text-xs text-slate-500">Assignee</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={task.assigneeId ?? ''}
            onChange={(e) => assignTask.mutate(e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-sm font-medium text-white">Comments</h3>
          <ul className="mt-3 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-slate-900 p-3 text-sm">
                <p className="text-slate-200">{c.body}</p>
                <p className="mt-1 text-xs text-slate-500">{c.authorName}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              placeholder="Add a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
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
