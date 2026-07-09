import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CalendarDays, Download, Paperclip, Pencil, PenLine, Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import type { Task } from '../api/types'
import {
  useAddComment,
  useAssignTask,
  useAttachLabel,
  useDeleteAttachment,
  useDetachLabel,
  useProjectLabels,
  useProjectMembers,
  useTask,
  useTaskAttachments,
  useTaskComments,
  useUpdateTask,
  useUpdateTaskStatus,
  useUploadAttachment,
} from '../api/queries'
import { downloadFile } from '../api/client'
import { getMutationErrorMessage } from '../lib/errors'
import { isAssignableMember } from '../lib/roles'
import {
  allowedStatusTransitions,
  formatTaskStatus,
  taskPriorities,
  taskStatuses,
  taskStatusTones,
} from '../lib/tasks'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { LabelChip } from './LabelChip'
import { Badge, Button } from './ui'
import type { Comment } from '../api/types'

export interface FocusComment {
  taskId: string
  actorId: string
  atUtc: string
}

interface TaskPanelProps {
  taskId: string
  projectId: string
  onClose: () => void
  focusComment?: FocusComment | null
}

function findMatchingComment(focus: FocusComment, comments: Comment[]): Comment | null {
  if (comments.length === 0) return null
  const target = new Date(focus.atUtc).getTime()
  const sameAuthor = comments.filter((c) => c.authorId === focus.actorId)
  const candidates = sameAuthor.length ? sameAuthor : comments
  return (
    [...candidates].sort(
      (a, b) =>
        Math.abs(new Date(a.createdAtUtc).getTime() - target) -
        Math.abs(new Date(b.createdAtUtc).getTime() - target),
    )[0] ?? null
  )
}

function formatDate(iso: string | null) {
  if (!iso) return 'No due date'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatWhen(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export function TaskPanel({ taskId, projectId, onClose, focusComment }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId)
  useEscapeToClose(onClose)

  if (isLoading || !task) {
    return (
      <aside className="pp-card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 p-6 shadow-2xl">
        <p className="pp-subtitle">Loading task...</p>
      </aside>
    )
  }

  return (
    <LoadedTaskPanel
      key={task.id}
      task={task}
      taskId={taskId}
      projectId={projectId}
      onClose={onClose}
      focusComment={focusComment}
    />
  )
}

interface LoadedTaskPanelProps extends TaskPanelProps {
  task: Task
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">{label}</p>
      <div className="mt-1 text-sm text-[#f8fafc]">{children}</div>
    </div>
  )
}

function LoadedTaskPanel({ task, taskId, projectId, onClose, focusComment }: LoadedTaskPanelProps) {
  const { data: comments = [] } = useTaskComments(taskId)
  const { data: members = [] } = useProjectMembers(projectId)
  const { data: projectLabels = [] } = useProjectLabels(projectId)
  const { data: attachments = [] } = useTaskAttachments(taskId)
  const assignableMembers = members.filter((member) => isAssignableMember(member.role))
  const updateStatus = useUpdateTaskStatus(taskId, projectId)
  const assignTask = useAssignTask(taskId, projectId)
  const updateTask = useUpdateTask(taskId, projectId)
  const addComment = useAddComment(taskId, projectId)
  const attachLabel = useAttachLabel(taskId, projectId)
  const detachLabel = useDetachLabel(taskId, projectId)
  const uploadAttachment = useUploadAttachment(taskId, projectId)
  const deleteAttachment = useDeleteAttachment(taskId, projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attachedLabelIds = new Set(task.labels.map((label) => label.id))
  const availableLabels = projectLabels.filter((label) => !attachedLabelIds.has(label.id))

  const [isEditing, setIsEditing] = useState(false)
  const [comment, setComment] = useState('')
  const focusedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!focusComment || focusComment.taskId !== taskId) return
    if (focusedRef.current === focusComment.atUtc) return
    const target = findMatchingComment(focusComment, comments)
    if (!target) return

    const element = document.getElementById(`pp-comment-${target.id}`)
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('pp-comment-highlight')
    // Mark the focus consumed only after the highlight has displayed, so
    // StrictMode's setup/cleanup/setup cycle re-applies it correctly.
    const timer = setTimeout(() => {
      focusedRef.current = focusComment.atUtc
      element.classList.remove('pp-comment-highlight')
    }, 2600)
    return () => {
      clearTimeout(timer)
      element.classList.remove('pp-comment-highlight')
    }
  }, [focusComment, comments, taskId])
  const [edit, setEdit] = useState<Partial<Task>>({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    dueDateUtc: task.dueDateUtc?.slice(0, 10) ?? '',
  })
  const allowedStatuses = allowedStatusTransitions[task.status] ?? [task.status]
  const mutationError = getMutationErrorMessage(
    updateStatus.error ??
      updateTask.error ??
      assignTask.error ??
      addComment.error ??
      attachLabel.error ??
      detachLabel.error ??
      uploadAttachment.error ??
      deleteAttachment.error,
  )

  const startEditing = () => {
    setEdit({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueDateUtc: task.dueDateUtc?.slice(0, 10) ?? '',
    })
    setIsEditing(true)
  }

  const handleFileSelected = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    uploadAttachment.mutate(file, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    })
  }

  return (
    <aside className="pp-card fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b pp-divider p-5">
        <div>
          <p className="pp-eyebrow">Task</p>
          <h2 className="mt-1 font-bold text-[#f8fafc]">Task detail</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="pp-button-secondary min-h-0 px-3 py-1.5 text-xs"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </button>
          )}
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {mutationError && (
          <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
            {mutationError}
          </p>
        )}

        {isEditing ? (
          <section className="space-y-5">
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
                  {taskStatuses.map((s) => (
                    <option key={s} value={s} disabled={!allowedStatuses.includes(s)}>
                      {formatTaskStatus(s)}
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
                  {taskPriorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Due date</label>
                <input
                  type="date"
                  className="pp-input mt-1 text-sm"
                  value={edit.dueDateUtc ?? ''}
                  onChange={(e) => setEdit((s) => ({ ...s, dueDateUtc: e.target.value }))}
                />
              </div>
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
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                disabled={updateTask.isPending}
                className="flex-1"
                onClick={() =>
                  updateTask.mutate(
                    {
                      title: edit.title ?? task.title,
                      description: edit.description || undefined,
                      priority: edit.priority ?? task.priority,
                      dueDateUtc: edit.dueDateUtc ? `${edit.dueDateUtc}T00:00:00Z` : null,
                    },
                    { onSuccess: () => setIsEditing(false) },
                  )
                }
              >
                {updateTask.isPending ? 'Saving...' : 'Save changes'}
              </Button>
              <button
                type="button"
                className="pp-button-secondary"
                onClick={() => setIsEditing(false)}
              >
                Done
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-bold leading-tight text-[#f8fafc]">{task.title}</h3>
                <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>{formatTaskStatus(task.status)}</Badge>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#8e99ad]">
                {task.lastEditedByName && task.updatedAtUtc ? (
                  <>
                    <PenLine className="h-3.5 w-3.5 text-[#ffb36c]" aria-hidden />
                    Edited by{' '}
                    <span className="font-semibold text-[#cbd5e1]">{task.lastEditedByName}</span> ·{' '}
                    {formatWhen(task.updatedAtUtc)}
                  </>
                ) : (
                  <>Created {formatWhen(task.createdAtUtc)}</>
                )}
              </p>
            </div>

            <p className="whitespace-pre-line text-sm leading-6 text-[#a9b1c0]">
              {task.description || 'No description yet.'}
            </p>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-3">
              <FactRow label="Priority">{task.priority}</FactRow>
              <FactRow label="Due date">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-[#8e99ad]" aria-hidden />
                  {formatDate(task.dueDateUtc)}
                </span>
              </FactRow>
              <FactRow label="Assignee">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#8e99ad]" aria-hidden />
                  {task.assigneeName ?? 'Unassigned'}
                </span>
              </FactRow>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Labels</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {task.labels.map((label) => (
                  <LabelChip key={label.id} label={label} />
                ))}
                {task.labels.length === 0 && <span className="text-xs text-[#687387]">No labels</span>}
              </div>
            </div>
          </section>
        )}

        {isEditing && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Labels</label>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {task.labels.map((label) => (
                <LabelChip
                  key={label.id}
                  label={label}
                  disabled={detachLabel.isPending}
                  onRemove={() => detachLabel.mutate(label.id)}
                />
              ))}
              {task.labels.length === 0 && <span className="text-xs text-[#687387]">No labels yet</span>}
            </div>
            {availableLabels.length > 0 && (
              <select
                aria-label="Add label"
                className="pp-select mt-2 text-sm"
                value=""
                disabled={attachLabel.isPending}
                onChange={(e) => e.target.value && attachLabel.mutate(e.target.value)}
              >
                <option value="" disabled>
                  Add label…
                </option>
                {availableLabels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">Attachments</label>
          <ul className="mt-2 space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-[#8e99ad]" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-[#f8fafc]">{attachment.fileName}</p>
                    <p className="text-xs text-[#8e99ad]">{formatFileSize(attachment.sizeBytes)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Download ${attachment.fileName}`}
                    className="pp-button-ghost min-h-0 p-1.5"
                    onClick={() => {
                      downloadFile(
                        `/api/tasks/${taskId}/attachments/${attachment.id}/download`,
                        attachment.fileName,
                      ).catch(() => toast.error(`Could not download "${attachment.fileName}".`))
                    }}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      aria-label={`Delete ${attachment.fileName}`}
                      disabled={deleteAttachment.isPending}
                      className="pp-button-ghost min-h-0 p-1.5 text-[#fca5a5]"
                      onClick={() => deleteAttachment.mutate(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {attachments.length === 0 && <li className="text-xs text-[#687387]">No attachments yet</li>}
          </ul>
          {isEditing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.md,.csv,.json,.xlsx,.docx,.zip"
                onChange={(e) => handleFileSelected(e.target.files)}
              />
              <button
                type="button"
                disabled={uploadAttachment.isPending}
                onClick={() => fileInputRef.current?.click()}
                className="pp-button-secondary mt-2 min-h-0 px-3 py-2 text-xs"
              >
                <Paperclip className="h-3.5 w-3.5" aria-hidden />
                {uploadAttachment.isPending ? 'Uploading…' : 'Upload file (max 5 MB)'}
              </button>
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#f8fafc]">Comments</h3>
          {comments.length === 0 && (
            <p className="mt-3 text-xs text-[#687387]">No comments yet. Start the conversation below.</p>
          )}
          <ul className="mt-3 space-y-2">
            {comments.map((c) => (
              <li
                key={c.id}
                id={`pp-comment-${c.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm transition"
              >
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
