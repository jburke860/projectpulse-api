import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  addTaskComment,
  changeTaskStatus,
  queryKeys,
  uploadTaskAttachment,
  useAddProjectMember,
  useCreateTask,
  useDeleteProject,
  useProject,
  useProjectActivity,
  useProjectMembers,
  useProjectSummary,
  useRemoveProjectMember,
  useTasks,
  useUpdateProject,
  useUsers,
  type TaskFilters,
} from '../api/queries'
import { ArrowLeft, Columns3, List, Search } from 'lucide-react'
import { ActivityFeed } from '../components/ActivityFeed'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LabelChip } from '../components/LabelChip'
import { CardSkeleton, Skeleton } from '../components/Skeleton'
import { ProjectIconTile } from '../components/ProjectIconTile'
import { TaskBoard } from '../components/TaskBoard'
import { TaskPanel } from '../components/TaskPanel'
import { Badge, Button, Card } from '../components/ui'
import { getMutationErrorMessage } from '../lib/errors'
import { formatProjectStatus, projectStatuses, projectStatusTone } from '../lib/projectStatus'
import { isAssignableMember, projectRoles } from '../lib/roles'
import { formatTaskStatus, taskPriorities, taskStatuses, taskStatusTones } from '../lib/tasks'
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

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssigneeId, setFilterAssigneeId] = useState('')
  const [searchText, setSearchText] = useState('')
  const [view, setView] = useState<'list' | 'board'>('list')

  const taskFilters: TaskFilters = {
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    assigneeId: filterAssigneeId || undefined,
  }

  const { data: project } = useProject(id)
  const { data: summary } = useProjectSummary(id)
  const { data: members = [] } = useProjectMembers(id)
  const { data: users = [] } = useUsers()
  const { data: tasks = [] } = useTasks(id, taskFilters)
  const { data: activity = [] } = useProjectActivity(id)
  const createTask = useCreateTask(id)
  const deleteProject = useDeleteProject()
  const updateProject = useUpdateProject(id)
  const addMember = useAddProjectMember(id)
  const removeMember = useRemoveProjectMember(id)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskStatus, setTaskStatus] = useState('Open')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [taskNote, setTaskNote] = useState('')
  const [taskFiles, setTaskFiles] = useState<File[]>([])
  const [taskFormError, setTaskFormError] = useState<string | null>(null)
  const [isFinalizingTask, setIsFinalizingTask] = useState(false)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState('Member')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; displayName: string } | null>(null)

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
  const isCreatingTask = createTask.isPending || isFinalizingTask
  const selectedTaskId = searchParams.get('taskId')
  const hasActiveFilters = Boolean(filterStatus || filterPriority || filterAssigneeId || searchText)
  const visibleTasks = searchText
    ? tasks.filter((task) =>
        `${task.title} ${task.description ?? ''}`.toLowerCase().includes(searchText.toLowerCase()),
      )
    : tasks

  const resetTaskForm = () => {
    setTaskTitle('')
    setTaskDescription('')
    setTaskPriority('Medium')
    setTaskStatus('Open')
    setTaskDueDate('')
    setTaskAssigneeId('')
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

  const handleDeleteProject = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => navigate('/projects'),
    })
  }

  return (
    <div className="pp-page-shell">
      <section className="pp-hero-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ffb36c] hover:text-[#fed7aa]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to projects
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ProjectIconTile projectId={project.id} />
              <h1 className="pp-title">{project.name}</h1>
              <Badge tone={projectStatusTone(project.status)}>{formatProjectStatus(project.status)}</Badge>
            </div>
            <p className="pp-subtitle mt-3 max-w-3xl">{project.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <Button
              type="button"
              disabled={deleteProject.isPending}
              onClick={() => setShowDeleteDialog(true)}
              variant="danger"
            >
              Delete project
            </Button>
          </div>
        </div>
      </section>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ['Total', summary.totalTasks],
            ['Open', summary.openTasks],
            ['In progress', summary.inProgressTasks],
            ['Done', summary.doneTasks],
            ['Overdue', summary.overdueTasks],
          ].map(([label, value]) => (
            <Card key={label as string} className="p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[#f8fafc]">{value as number}</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
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
                className="pp-input pl-9 text-sm"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <select
              aria-label="Filter by status"
              className="pp-select w-auto text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatTaskStatus(status)}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by priority"
              className="pp-select w-auto text-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All priorities</option>
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by assignee"
              className="pp-select w-auto text-sm"
              value={filterAssigneeId}
              onChange={(e) => setFilterAssigneeId(e.target.value)}
            >
              <option value="">All assignees</option>
              {assignableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                className="pp-button-ghost min-h-0 px-3 py-2 text-xs"
                onClick={() => {
                  setFilterStatus('')
                  setFilterPriority('')
                  setFilterAssigneeId('')
                  setSearchText('')
                }}
              >
                Clear filters
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
                        setTaskFiles((files) => [...files, ...Array.from(e.target.files ?? [])])
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
              {visibleTasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ taskId: task.id })}
                    className="pp-card pp-card-hover w-full px-4 py-4 text-left"
                  >
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
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#a9b1c0]">
                      {task.description || 'No description yet'}
                    </p>
                    {task.labels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {task.labels.map((label) => (
                          <LabelChip key={label.id} label={label} />
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <Card className="p-5">
            <div>
              <p className="pp-eyebrow">Team</p>
              <h2 className="mt-1 text-lg font-bold text-[#f8fafc]">Members</h2>
            </div>
            {memberMutationError && (
              <p className="mt-3 rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
                {memberMutationError}
              </p>
            )}
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!memberUserId) return
                addMember.mutate(
                  { userId: memberUserId, role: memberRole },
                  { onSuccess: () => setMemberUserId('') },
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
            <ul className="mt-4 space-y-3">
              {members.map((m) => (
                <li key={m.userId} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#f8fafc]">{m.displayName}</p>
                    <p className="truncate text-xs text-[#8e99ad]">
                      {m.role} · {m.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={removeMember.isPending || (m.role === 'Admin' && adminCount <= 1)}
                    onClick={() => setMemberToRemove({ userId: m.userId, displayName: m.displayName })}
                    className="pp-button-danger min-h-0 shrink-0 rounded-lg px-2 py-1 text-xs"
                  >
                    Remove
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

      {selectedTaskId && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px]"
            aria-label="Close task panel"
            onClick={() => setSearchParams({}, { replace: true })}
          />
          <TaskPanel taskId={selectedTaskId} projectId={id} onClose={() => setSearchParams({}, { replace: true })} />
        </>
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
