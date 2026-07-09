import { createPortal } from 'react-dom'
import { ArrowUpRight, CalendarDays, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../api/types'
import { formatShortDate } from '../lib/dates'
import { formatTaskStatus, isTaskOverdue, taskStatusTones } from '../lib/tasks'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { LabelChip } from './LabelChip'
import { Badge } from './ui'

interface TaskPreviewDialogProps {
  task: Task | null
  onClose: () => void
}

export function TaskPreviewDialog({ task, onClose }: TaskPreviewDialogProps) {
  const navigate = useNavigate()
  useEscapeToClose(onClose, task !== null)

  if (!task) return null

  const overdue = isTaskOverdue(task)

  // Portaled to <body> so transformed/filtered ancestors can never hijack
  // the fixed positioning.
  return createPortal(
    <>
      <button
        type="button"
        className="pp-overlay-enter fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close task preview"
        onClick={onClose}
      />
      <aside className="pp-card pp-dialog-enter fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b pp-divider pb-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-[#8e99ad]">{task.projectName}</p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-[#f8fafc]">{task.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="pp-button-ghost min-h-0 px-2 py-1">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>{formatTaskStatus(task.status)}</Badge>
            <Badge tone="neutral">{task.priority}</Badge>
            {task.labels.map((label) => (
              <LabelChip key={label.id} label={label} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm">
            <span className="flex items-center gap-2 text-[#cbd5e1]">
              <CalendarDays className="h-4 w-4 text-[#8e99ad]" aria-hidden />
              <span className={overdue ? 'font-semibold text-[#fca5a5]' : undefined}>
                {task.dueDateUtc ? formatShortDate(task.dueDateUtc) : 'No due date'}
              </span>
            </span>
            <span className="flex items-center gap-2 text-[#cbd5e1]">
              <User className="h-4 w-4 text-[#8e99ad]" aria-hidden />
              {task.assigneeName ?? 'Unassigned'}
            </span>
          </div>

          <p className="line-clamp-4 text-sm leading-6 text-[#a9b1c0]">
            {task.description || 'No description yet.'}
          </p>

          <button
            type="button"
            className="pp-button-primary w-full"
            onClick={() => {
              onClose()
              navigate(`/projects/${task.projectId}?taskId=${task.id}`)
            }}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
            Jump to task
          </button>
        </div>
      </aside>
    </>,
    document.body,
  )
}
