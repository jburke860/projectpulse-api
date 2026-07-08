import { useRef, useState } from 'react'
import { Download, Paperclip, Trash2 } from 'lucide-react'
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
import { allowedStatusTransitions, formatTaskStatus, taskPriorities, taskStatuses } from '../lib/tasks'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { LabelChip } from './LabelChip'
import { Button } from './ui'

interface TaskPanelProps {
  taskId: string
  projectId: string
  onClose: () => void
}

export function TaskPanel({ taskId, projectId, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId)
  useEscapeToClose(onClose)

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
  const { data: projectLabels = [] } = useProjectLabels(projectId)
  const { data: attachments = [] } = useTaskAttachments(taskId)
  const assignableMembers = members.filter((member) => isAssignableMember(member.role))
  const updateStatus = useUpdateTaskStatus(taskId, projectId)
  const assignTask = useAssignTask(taskId, projectId)
  const updateTask = useUpdateTask(taskId, projectId)
  const addComment = useAddComment(taskId, projectId)
  const attachLabel = useAttachLabel(taskId, projectId)
  const detachLabel = useDetachLabel(taskId, projectId)
  const uploadAttachment = useUploadAttachment(taskId)
  const deleteAttachment = useDeleteAttachment(taskId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attachedLabelIds = new Set(task.labels.map((label) => label.id))
  const availableLabels = projectLabels.filter((label) => !attachedLabelIds.has(label.id))

  const [comment, setComment] = useState('')
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

  const handleFileSelected = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    uploadAttachment.mutate(file, {
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
    return `${bytes} B`
  }

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
            {task.labels.length === 0 && (
              <span className="text-xs text-[#687387]">No labels yet</span>
            )}
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
                    onClick={() =>
                      downloadFile(
                        `/api/tasks/${taskId}/attachments/${attachment.id}/download`,
                        attachment.fileName,
                      )
                    }
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${attachment.fileName}`}
                    disabled={deleteAttachment.isPending}
                    className="pp-button-ghost min-h-0 p-1.5 text-[#fca5a5]"
                    onClick={() => deleteAttachment.mutate(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
            {attachments.length === 0 && (
              <li className="text-xs text-[#687387]">No attachments yet</li>
            )}
          </ul>
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
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#f8fafc]">Comments</h3>
          {comments.length === 0 && (
            <p className="mt-3 text-xs text-[#687387]">No comments yet. Start the conversation below.</p>
          )}
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
