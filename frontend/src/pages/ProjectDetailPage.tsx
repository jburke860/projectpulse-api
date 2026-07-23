import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  addTaskComment,
  attachTaskLabel,
  changeTaskStatus,
  queryKeys,
  uploadTaskAttachment,
  useAddProjectMember,
  useCreateTask,
  useDeleteProjectAttachment,
  useDeleteProject,
  useProject,
  useProjectAttachments,
  useProjectActivity,
  useProjectLabels,
  useProjectMembers,
  useProjectSummary,
  useRemoveProjectMember,
  useTasks,
  useUpdateProject,
  useUploadProjectAttachment,
  useUsers,
  type TaskFilters,
} from '../api/queries'
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDot,
  CircleEllipsis,
  Columns3,
  Download,
  List,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Search,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ActivityFeed } from '../components/ActivityFeed'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EditProjectDialog } from '../components/EditProjectDialog'
import { FileTypeIcon } from '../components/FileTypeIcon'
import { LabelChip } from '../components/LabelChip'
import { MemberProfileDialog } from '../components/MemberProfileDialog'
import { CardSkeleton, Skeleton } from '../components/Skeleton'
import { ProjectIconTile } from '../components/ProjectIconTile'
import { TaskBoard } from '../components/TaskBoard'
import { TaskFilterMenu } from '../components/TaskFilterMenu'
import { emptyTaskFilters, type TaskFilterValues } from '../lib/taskFilters'
import { TaskPanel, type FocusComment } from '../components/TaskPanel'
import { Badge, Button, Card } from '../components/ui'
import { useDemoSession } from '../demo/DemoSessionContext'
import { getMutationErrorMessage } from '../lib/errors'
import { presenceFor } from '../lib/presence'
import { formatProjectStatus, projectStatuses, projectStatusTone } from '../lib/projectStatus'
import { isAssignableMember, projectRoles } from '../lib/roles'
import { formatTaskStatus, taskPriorities, taskStatuses, taskStatusTones } from '../lib/tasks'
import { downloadFile } from '../api/client'

const taskStatusIcons: Record<string, { icon: LucideIcon; color: string }> = {
  Open: { icon: Circle, color: '#94a3b8' },
  InProgress: { icon: CircleDot, color: '#ff7b22' },
  InReview: { icon: CircleEllipsis, color: '#eab308' },
  Done: { icon: CheckCircle2, color: '#22c55e' },
  Cancelled: { icon: XCircle, color: '#ef4444' },
}

const memberRoleTones: Record<string, 'neutral' | 'orange' | 'green' | 'yellow' | 'red'> = {
  Admin: 'orange',
  Member: 'green',
  Viewer: 'neutral',
}
const initialStatusTransitions: Record<string, string[]> = {
  Open: [],
  InProgress: ['InProgress'],
  InReview: ['InProgress', 'InReview'],
  Done: ['InProgress', 'InReview', 'Done'],
  Cancelled: ['Cancelled'],
}

function toDueDateUtc(date: string) {
  return date ? `${date}T00:00:00Z` : undefined
}

function formatDueDate(date: string | null) {
  if (!date) return 'No due date'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTaskFileSummary(task: { attachmentCount: number; attachmentFileNames: string[] }) {
  if (task.attachmentCount === 0) return null
  if (task.attachmentCount === 1) return task.attachmentFileNames[0] ?? '1 file attached'
  return `${task.attachmentCount} files attached`
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TaskFilterValues>(emptyTaskFilters)
  const [searchText, setSearchText] = useState('')
  const [view, setView] = useState<'list' | 'board'>('list')

  const taskFilters: TaskFilters = {
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    assigneeId: filters.assigneeId || undefined,
  }

  const { data: project } = useProject(id)
  const { data: summary } = useProjectSummary(id)
  const { data: members = [] } = useProjectMembers(id)
  const { data: users = [] } = useUsers()
  const { data: tasks = [] } = useTasks(id, taskFilters)
  const { data: activity = [] } = useProjectActivity(id)
  const { data: projectLabels = [] } = useProjectLabels(id)
  const { data: projectAttachments = [] } = useProjectAttachments(id)
  const createTask = useCreateTask(id)
  const deleteProject = useDeleteProject()
  const updateProject = useUpdateProject(id)
  const addMember = useAddProjectMember(id)
  const removeMember = useRemoveProjectMember(id)
  const uploadProjectAttachment = useUploadProjectAttachment(id)
  const deleteProjectAttachment = useDeleteProjectAttachment(id)

  // Deep link from the dashboard's Quick Add menu.
  const [showTaskForm, setShowTaskForm] = useState(() => searchParams.get('newTask') === '1')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskStatus, setTaskStatus] = useState('Open')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [selectedTaskLabelIds, setSelectedTaskLabelIds] = useState<string[]>([])
  const [taskNote, setTaskNote] = useState('')
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [taskFormError, setTaskFormError] = useState<string | null>(null)
  const [isFinalizingTask, setIsFinalizingTask] = useState(false)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState('Member')
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; displayName: string } | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const { userId: sessionUserId } = useDemoSession()

  if (!project) {
    return (
      <div className="pp-page-shell">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <CardSkeleton lines={3} />
            <CardSkeleton lines={3} />
          </div>
          <CardSkeleton lines={6} />
        </div>
      </div>
    )
  }

  const progress =
    summary && summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0
  const memberIds = new Set(members.map((member) => member.userId))
  const availableUsers = users.filter((user) => !memberIds.has(user.id))
  const assignableMembers = members.filter((member) => isAssignableMember(member.role))
  const adminCount = members.filter((member) => member.role === 'Admin').length
  const memberMutationError = getMutationErrorMessage(addMember.error ?? removeMember.error)
  const projectFileMutationError = getMutationErrorMessage(
    uploadProjectAttachment.error ?? deleteProjectAttachment.error,
  )
  const isCreatingTask = createTask.isPending || isFinalizingTask
  const selectedTaskId = searchParams.get('taskId')
  const stateFocusComment = (location.state as { focusComment?: FocusComment } | null)?.focusComment ?? null
  const focusComment = stateFocusComment && stateFocusComment.taskId === selectedTaskId ? stateFocusComment : null
  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.assigneeId || filters.labelId || searchText,
  )
  const visibleTasks = tasks.filter(
    (task) =>
      (!filters.labelId || task.labels.some((label) => label.id === filters.labelId)) &&
      (!searchText ||
        `${task.title} ${task.description ?? ''}`.toLowerCase().includes(searchText.toLowerCase())),
  )

  const resetTaskForm = () => {
    setTaskTitle('')
    setTaskDescription('')
    setTaskPriority('Medium')
    setTaskStatus('Open')
    setTaskDueDate('')
    setTaskAssigneeId('')
    setSelectedTaskLabelIds([])
    setTaskNote('')
    setTaskFiles([])
    setTaskFormError(null)
  }

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!taskAssigneeId) {
      setTaskFormError('Choose an Admin or Member assignee before creating the task.')
      return
    }

    try {
      setTaskFormError(null)
      const task = await createTask.mutateAsync({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        assigneeId: taskAssigneeId,
        dueDateUtc: toDueDateUtc(taskDueDate),
      })

      setIsFinalizingTask(true)
      for (const status of initialStatusTransitions[taskStatus] ?? []) {
        await changeTaskStatus(task.id, status)
      }

      if (taskNote.trim()) {
        await addTaskComment(task.id, taskNote.trim())
      }

      for (const labelId of selectedTaskLabelIds) {
        await attachTaskLabel(task.id, labelId)
      }

      for (const file of taskFiles) {
        await uploadTaskAttachment(task.id, file)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.task(task.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(task.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectSummary(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activity }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ])

      resetTaskForm()
      setShowTaskForm(false)
    } catch (mutationError) {
      setTaskFormError(getMutationErrorMessage(mutationError))
    } finally {
      setIsFinalizingTask(false)
    }
  }

  const toggleTaskLabel = (labelId: string) => {
    setSelectedTaskLabelIds((labelIds) =>
      labelIds.includes(labelId)
        ? labelIds.filter((id) => id !== labelId)
        : [...labelIds, labelId],
    )
  }

  const handleDeleteProject = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => navigate('/projects'),
    })
  }

  return (
    <div className="pp-page-shell">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link to="/projects" className="font-semibold text-[#8e99ad] transition hover:text-[#f8fafc]">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4 text-[#687387]" aria-hidden />
        <span className="truncate font-semibold text-[#f8fafc]">{project.name}</span>
      </nav>

      <section className="pp-hero-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <ProjectIconTile projectId={project.id} icon={project.icon} color={project.color} />
              <h1 className="pp-title">{project.name}</h1>
              <Badge tone={projectStatusTone(project.status)}>{formatProjectStatus(project.status)}</Badge>
            </div>
            <p className="pp-subtitle mt-3 max-w-3xl">{project.description}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <select
              aria-label="Project status"
              className="pp-select w-auto text-sm"
              value={project.status}
              disabled={updateProject.isPending}
              onChange={(e) =>
                updateProject.mutate({
                  name: project.name,
                  description: project.description,
                  status: e.target.value,
                })
              }
            >
              {projectStatuses.map((option) => (
                <option key={option} value={option}>
                  {formatProjectStatus(option)}
                </option>
              ))}
            </select>
            <div className="relative">
              <button
                type="button"
                aria-label="Project actions"
                aria-expanded={showProjectMenu}
                onClick={() => setShowProjectMenu((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#a9b1c0] transition hover:text-[#f8fafc]"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </button>
              {showProjectMenu && (
                <>
                  <button
                    type="button"
                    aria-label="Close project actions"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowProjectMenu(false)}
                  />
                  <div className="pp-card pp-menu-enter absolute right-0 top-full z-50 mt-2 w-52 space-y-1 p-2 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProjectMenu(false)
                        setShowEditDialog(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#a9b1c0] transition hover:bg-white/[0.06] hover:text-[#f8fafc]"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Edit project
                    </button>
                    <button
                      type="button"
                      disabled={deleteProject.isPending}
                      onClick={() => {
                        setShowProjectMenu(false)
                        setShowDeleteDialog(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#fca5a5] transition hover:bg-[#ef4444]/10"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Delete project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Total', summary.totalTasks],
            ['Open', summary.openTasks],
            ['In Progress', summary.inProgressTasks],
            ['Done', summary.doneTasks],
            ['Overdue', summary.overdueTasks],
          ].map(([label, value]) => (
            <Card key={label as string} className="px-4 py-5 text-center">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8e99ad]">{label}</p>
              <p className="mt-1.5 text-3xl font-extrabold text-[#f8fafc]">{value as number}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-[#cbd5e1]">Progress</span>
          <span className="text-[#f8fafc]">{progress}% complete</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d92d20] via-[#ff7b22] to-[#ffb347] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="pp-eyebrow">Essential information</p>
            <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Project Files</h2>
          </div>
          <label className="pp-button-secondary cursor-pointer">
            <Upload className="h-4 w-4" aria-hidden />
            {uploadProjectAttachment.isPending ? 'Uploading...' : 'Upload files'}
            <input
              type="file"
              multiple
              className="hidden"
              accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.md,.csv,.json,.xlsx,.docx,.zip"
              onChange={async (e) => {
                const selected = Array.from(e.target.files ?? [])
                e.target.value = ''
                try {
                  for (const file of selected) {
                    await uploadProjectAttachment.mutateAsync(file)
                  }
                } catch {
                  // The mutation hook surfaces the upload error in the form.
                }
              }}
            />
          </label>
        </div>
        {projectFileMutationError && (
          <p className="mt-3 rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
            {projectFileMutationError}
          </p>
        )}
        {projectAttachments.length === 0 ? (
          <p className="mt-4 text-sm text-[#8e99ad]">No project files yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
            {projectAttachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm transition hover:border-white/20"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileTypeIcon fileName={attachment.fileName} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#f8fafc]">{attachment.fileName}</p>
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
                        `/api/projects/${project.id}/attachments/${attachment.id}/download`,
                        attachment.fileName,
                      ).catch(() => toast.error(`Could not download "${attachment.fileName}".`))
                    }}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${attachment.fileName}`}
                    disabled={deleteProjectAttachment.isPending}
                    className="pp-button-ghost min-h-0 p-1.5 text-[#fca5a5]"
                    onClick={() => deleteProjectAttachment.mutate(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* min-w-0 keeps either column's intrinsic width from forcing the page
          wider than a phone viewport. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="pp-eyebrow">Execution</p>
              <h2 className="mt-1 text-xl font-bold text-[#f8fafc]">Tasks</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    view === 'list'
                      ? 'bg-[#ff7b22]/15 text-[#fff7ed] shadow-[inset_0_0_0_1px_rgba(255,122,34,0.35)]'
                      : 'text-[#a9b1c0] hover:text-[#f8fafc]'
                  }`}
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  List
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'board'}
                  onClick={() => setView('board')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    view === 'board'
                      ? 'bg-[#ff7b22]/15 text-[#fff7ed] shadow-[inset_0_0_0_1px_rgba(255,122,34,0.35)]'
                      : 'text-[#a9b1c0] hover:text-[#f8fafc]'
                  }`}
                >
                  <Columns3 className="h-3.5 w-3.5" aria-hidden />
                  Board
                </button>
              </div>
              <Button
              type="button"
              onClick={() => {
                if (showTaskForm) {
                  resetTaskForm()
                  setShowTaskForm(false)
                } else {
                  setTaskFormError(null)
                  setShowTaskForm(true)
                }
              }}
              variant={showTaskForm ? 'secondary' : 'primary'}
            >
              {showTaskForm ? 'Cancel' : 'New task'}
            </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687387]" aria-hidden />
              <input
                type="search"
                aria-label="Search tasks"
                placeholder="Search tasks…"
                className="pp-input pp-input-icon-left text-sm"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <TaskFilterMenu
              filters={filters}
              assignees={assignableMembers}
              labels={projectLabels}
              onChange={setFilters}
            />
            {hasActiveFilters && (
              <button
                type="button"
                className="pp-button-ghost min-h-0 px-3 py-2 text-xs"
                onClick={() => {
                  setFilters(emptyTaskFilters)
                  setSearchText('')
                }}
              >
                Clear
              </button>
            )}
          </div>

          {showTaskForm && (
            <form
              className="pp-card space-y-6 p-5 sm:p-6"
              onSubmit={handleCreateTask}
            >
              {taskFormError && (
                <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
                  {taskFormError}
                </p>
              )}

              <section className="space-y-4">
                <div>
                  <p className="pp-eyebrow">Step 1</p>
                  <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Task details</h3>
                  <p className="mt-1 text-sm text-[#8e99ad]">Capture enough context for the task to be actionable.</p>
                </div>
                <label className="pp-label">
                  Task title
                  <input
                    required
                    maxLength={300}
                    placeholder="Finalize rollout checklist"
                    className="pp-input text-sm"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </label>
                <label className="pp-label">
                  Detailed task description
                  <textarea
                    rows={4}
                    maxLength={1800}
                    placeholder="Acceptance criteria, implementation notes, dependencies, or launch context"
                    className="pp-textarea resize-y text-sm"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="pp-label">
                    Priority
                    <select
                      className="pp-select text-sm"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                    >
                      {taskPriorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pp-label">
                    Status
                    <select
                      className="pp-select text-sm"
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value)}
                    >
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pp-label">
                    Due date
                    <input
                      type="date"
                      className="pp-input text-sm"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4 border-t pp-divider pt-5">
                <div>
                  <p className="pp-eyebrow">Step 2</p>
                  <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Assignment</h3>
                  <p className="mt-1 text-sm text-[#8e99ad]">Only Admin and Member users can own tasks.</p>
                </div>
                <label className="pp-label">
                  Assignee
                  <select
                    required
                    className="pp-select text-sm"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    disabled={assignableMembers.length === 0}
                  >
                    <option value="" disabled>
                      Select eligible project member
                    </option>
                    {assignableMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.displayName} · {member.role}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="space-y-3 border-t pp-divider pt-5">
                <div>
                  <p className="pp-eyebrow">Step 3</p>
                  <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Labels</h3>
                </div>
                {projectLabels.length === 0 ? (
                  <p className="text-sm text-[#8e99ad]">No labels available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projectLabels.map((label) => {
                      const selected = selectedTaskLabelIds.includes(label.id)

                      return (
                        <button
                          key={label.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleTaskLabel(label.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? 'border-[#ffb36c] bg-[#ff7b22]/15 text-[#fff7ed]'
                              : 'border-white/10 bg-white/[0.025] text-[#a9b1c0] hover:text-[#f8fafc]'
                          }`}
                        >
                          {label.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="space-y-3 border-t pp-divider pt-5">
                <div>
                  <p className="pp-eyebrow">Step 4</p>
                  <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Files</h3>
                </div>
                <div className="rounded-xl border border-dashed border-[#ff7b22]/35 bg-[#ff7b22]/[0.035] p-4">
                  <label className="pp-button-secondary cursor-pointer">
                    Choose files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.md,.csv,.json,.xlsx,.docx,.zip"
                      onChange={(e) => {
                        const selected = Array.from(e.target.files ?? [])
                        setTaskFiles((files) => [...files, ...selected])
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {taskFiles.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {taskFiles.map((file, index) => (
                        <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-sm text-[#cbd5e1]">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            className="pp-button-ghost min-h-0 px-2 py-0.5 text-xs"
                            onClick={() => setTaskFiles((files) => files.filter((_, i) => i !== index))}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-sm leading-6 text-[#8e99ad]">
                    Files upload after the task is created. Max 5 MB each.
                  </p>
                </div>
              </section>

              <section className="space-y-3 border-t pp-divider pt-5">
                <label className="pp-label">
                  Comments / context
                  <textarea
                    rows={3}
                    maxLength={1200}
                    placeholder="Optional initial implementation note or handoff context"
                    className="pp-textarea resize-y text-sm"
                    value={taskNote}
                    onChange={(e) => setTaskNote(e.target.value)}
                  />
                </label>
              </section>

              <div className="flex flex-wrap justify-end gap-3 border-t pp-divider pt-5">
                <Button
                  type="button"
                  onClick={() => {
                    resetTaskForm()
                    setShowTaskForm(false)
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingTask || !taskTitle.trim() || !taskAssigneeId}
                >
                  {isCreatingTask ? 'Creating...' : 'Create task'}
                </Button>
              </div>
            </form>
          )}

          {visibleTasks.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-[#8e99ad]">
              {hasActiveFilters ? 'No tasks match the current filters.' : 'No tasks yet.'}
            </p>
          )}

          {view === 'board' ? (
            <TaskBoard
              tasks={visibleTasks}
              projectId={id}
              onSelectTask={(taskId) => setSearchParams({ taskId })}
            />
          ) : (
            <ul className="space-y-3">
              {visibleTasks.map((task) => {
                const fileSummary = formatTaskFileSummary(task)
                const statusIcon = taskStatusIcons[task.status] ?? taskStatusIcons.Open
                const StatusIcon = statusIcon.icon

                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ taskId: task.id })}
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
                                Assigned to {task.assigneeName ?? 'Unassigned'} · {task.priority} ·{' '}
                                {task.dueDateUtc ? `Due ${formatDueDate(task.dueDateUtc)}` : 'No due date'}
                              </p>
                            </div>
                            <Badge tone={taskStatusTones[task.status] ?? 'neutral'}>{formatTaskStatus(task.status)}</Badge>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#a9b1c0]">
                            {task.description || 'No description yet'}
                          </p>
                          {fileSummary && (
                            <p className="mt-2.5 flex items-center gap-1.5 truncate text-xs font-medium text-[#ffb36c]">
                              <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              <span className="truncate">{fileSummary}</span>
                            </p>
                          )}
                          {task.labels.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
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
        </section>

        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="pp-eyebrow">Team</p>
                <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Members</h2>
              </div>
              <button
                type="button"
                aria-expanded={showMemberForm}
                onClick={() => setShowMemberForm((open) => !open)}
                className="pp-button-secondary min-h-0 px-3 py-2 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden />
                Add member
              </button>
            </div>
            {memberMutationError && (
              <p className="mt-3 rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
                {memberMutationError}
              </p>
            )}
            {showMemberForm && (
              <form
                className="mt-3 grid gap-2 rounded-xl border border-dashed border-[#ff7b22]/35 bg-[#ff7b22]/[0.035] p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!memberUserId) return
                  addMember.mutate(
                    { userId: memberUserId, role: memberRole },
                    {
                      onSuccess: () => {
                        setMemberUserId('')
                        setShowMemberForm(false)
                      },
                    },
                  )
                }}
              >
                <select
                  required
                  aria-label="User"
                  className="pp-select text-sm"
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  disabled={availableUsers.length === 0}
                >
                  <option value="" disabled>
                    Add person
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    className="pp-select min-w-0 flex-1 text-sm"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    {projectRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!memberUserId || addMember.isPending}
                    className="pp-button-primary"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}
            <ul className="mt-4 space-y-2">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => setProfileUserId(m.userId)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:bg-white/[0.04]"
                  >
                    <Avatar
                      name={m.displayName}
                      id={m.userId}
                      presence={presenceFor(m.userId, sessionUserId)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[#f8fafc]">{m.displayName}</span>
                      <span className="block truncate text-xs text-[#8e99ad]">{m.email}</span>
                    </span>
                  </button>
                  <Badge tone={memberRoleTones[m.role] ?? 'neutral'}>{m.role}</Badge>
                  <button
                    type="button"
                    aria-label={`Remove ${m.displayName}`}
                    disabled={removeMember.isPending || (m.role === 'Admin' && adminCount <= 1)}
                    onClick={() => setMemberToRemove({ userId: m.userId, displayName: m.displayName })}
                    className="pp-button-ghost min-h-0 shrink-0 p-1.5 text-[#fca5a5] disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div>
              <p className="pp-eyebrow">Latest</p>
              <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Recent activity</h2>
            </div>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <ActivityFeed items={activity.slice(0, 5)} compact />
            </div>
          </Card>
        </div>
      </div>

      {showEditDialog && (
        <EditProjectDialog project={project} onClose={() => setShowEditDialog(false)} />
      )}

      {profileUserId && (
        <MemberProfileDialog
          userId={profileUserId}
          sessionUserId={sessionUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {selectedTaskId && (
        <TaskPanel
          taskId={selectedTaskId}
          projectId={id}
          focusComment={focusComment}
          onClose={() => setSearchParams({}, { replace: true })}
        />
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete project?"
        description={`"${project.name}" and all of its tasks will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete project"
        isPending={deleteProject.isPending}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProject}
      />

      <ConfirmDialog
        open={memberToRemove !== null}
        title="Remove member?"
        description={`${memberToRemove?.displayName} will be removed from this project and unassigned from their tasks.`}
        confirmLabel="Remove member"
        isPending={removeMember.isPending}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (!memberToRemove) return
          removeMember.mutate(memberToRemove.userId, {
            onSuccess: () => setMemberToRemove(null),
          })
        }}
      />
    </div>
  )
}
