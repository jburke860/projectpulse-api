import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  CircleDot,
  CircleEllipsis,
  Paperclip,
  Search,
  SquareCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useProjectLabels, useProjects, useTasks, useUsers, type TaskFilters } from '../api/queries'
import type { Task } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import { LabelChip } from '../components/LabelChip'
import { CardSkeleton } from '../components/Skeleton'
import { TaskFilterMenu } from '../components/TaskFilterMenu'
import { TaskPreviewDialog } from '../components/TaskPreviewDialog'
import { Badge, PageHeader } from '../components/ui'
import { formatShortDate } from '../lib/dates'
import { emptyTaskFilters, type TaskFilterValues } from '../lib/taskFilters'
import { formatTaskStatus, isTaskOverdue, taskStatusTones } from '../lib/tasks'

const taskStatusIcons: Record<string, { icon: LucideIcon; color: string }> = {
  Open: { icon: Circle, color: '#94a3b8' },
  InProgress: { icon: CircleDot, color: '#ff7b22' },
  InReview: { icon: CircleEllipsis, color: '#eab308' },
  Done: { icon: CheckCircle2, color: '#22c55e' },
  Cancelled: { icon: XCircle, color: '#ef4444' },
}

export function TasksPage() {
  const [filters, setFilters] = useState<TaskFilterValues>(emptyTaskFilters)
  const [previewTask, setPreviewTask] = useState<Task | null>(null)
  const [projectId, setProjectId] = useState('')
  const [searchText, setSearchText] = useState('')

  const taskFilters: TaskFilters = {
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    assigneeId: filters.assigneeId || undefined,
  }

  const { data: projects = [] } = useProjects()
  const { data: users = [] } = useUsers()
  const { data: tasks = [], isLoading } = useTasks(projectId || undefined, taskFilters)
  // Labels are per-project, so the label filter is only offered when scoped.
  const { data: scopedLabels = [] } = useProjectLabels(projectId)

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.assigneeId || filters.labelId || projectId || searchText,
  )
  const visibleTasks = tasks.filter(
    (task) =>
      (!filters.labelId || task.labels.some((label) => label.id === filters.labelId)) &&
      (!searchText ||
        `${task.title} ${task.description ?? ''} ${task.projectName}`
          .toLowerCase()
          .includes(searchText.toLowerCase())),
  )
  // Labels differ per project; only offer the label filter when scoped to one.
  const scopedProject = projects.find((project) => project.id === projectId)

  return (
    <div className="pp-page-shell">
      <PageHeader
        eyebrow="Workspace"
        title="Tasks"
        description={`${visibleTasks.length} task${visibleTasks.length === 1 ? '' : 's'} across ${
          scopedProject ? scopedProject.name : 'all projects'
        }.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687387]"
            aria-hidden
          />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="pp-input pp-input-icon-left text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by project"
          className="pp-select w-auto text-sm"
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value)
            setFilters((current) => ({ ...current, labelId: '' }))
          }}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <TaskFilterMenu
          filters={filters}
          assignees={users.map((user) => ({ userId: user.id, displayName: user.displayName }))}
          labels={scopedLabels}
          onChange={setFilters}
        />
        {hasActiveFilters && (
          <button
            type="button"
            className="pp-button-ghost min-h-0 px-3 py-2 text-xs"
            onClick={() => {
              setFilters(emptyTaskFilters)
              setProjectId('')
              setSearchText('')
            }}
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      ) : visibleTasks.length === 0 ? (
        <EmptyState
          icon={SquareCheck}
          title="No tasks match"
          description={
            hasActiveFilters
              ? 'Try clearing a filter or searching for something else.'
              : 'Tasks created in any project will show up here.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visibleTasks.map((task) => {
            const statusIcon = taskStatusIcons[task.status] ?? taskStatusIcons.Open
            const StatusIcon = statusIcon.icon
            const overdue = isTaskOverdue(task)

            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => setPreviewTask(task)}
                  className="pp-card pp-card-hover w-full px-4 py-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${statusIcon.color}1a`, color: statusIcon.color }}
                      aria-hidden
                    >
                      <StatusIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#f8fafc]">{task.title}</p>
                          <p className="mt-1 text-xs text-[#8e99ad]">
                            {task.projectName} · {task.assigneeName ?? 'Unassigned'} · {task.priority} ·{' '}
                            <span className={overdue ? 'font-semibold text-[#fca5a5]' : undefined}>
                              {task.dueDateUtc ? `Due ${formatShortDate(task.dueDateUtc)}` : 'No due date'}
                            </span>
                          </p>
                        </div>
                        <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>
                          {formatTaskStatus(task.status)}
                        </Badge>
                      </div>
                      {(task.attachmentCount > 0 || task.labels.length > 0) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {task.attachmentCount > 0 && (
                            <span className="flex items-center gap-1 text-xs font-medium text-[#ffb36c]">
                              <Paperclip className="h-3.5 w-3.5" aria-hidden />
                              {task.attachmentCount}
                            </span>
                          )}
                          {task.labels.map((label) => (
                            <LabelChip key={label.id} label={label} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <TaskPreviewDialog task={previewTask} onClose={() => setPreviewTask(null)} />
    </div>
  )
}
