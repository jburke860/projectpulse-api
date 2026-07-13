import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getMutationErrorMessage } from '../lib/errors'
import { deleteData, getData, patchData, postData, postFormData, putData } from './client'
import type {
  Attachment,
  AuditLog,
  Comment,
  Dashboard,
  DemoSession,
  Label,
  PagedResult,
  Project,
  ProjectMember,
  ProjectSummary,
  Task,
  User,
  WorkspaceAttachment,
} from './types'

export interface TaskFilters {
  status?: string
  priority?: string
  assigneeId?: string
}

async function getPagedItems<T>(url: string) {
  const result = await getData<PagedResult<T>>(url)
  return result.items
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  projectSummary: (id: string) => ['projectSummary', id] as const,
  projectMembers: (id: string) => ['projectMembers', id] as const,
  projectActivity: (id: string) => ['projectActivity', id] as const,
  projectLabels: (id: string) => ['projectLabels', id] as const,
  projectAttachments: (id: string) => ['projectAttachments', id] as const,
  tasks: (projectId?: string, filters?: TaskFilters) =>
    filters && Object.values(filters).some(Boolean)
      ? (['tasks', projectId ?? 'all', filters] as const)
      : (['tasks', projectId ?? 'all'] as const),
  task: (id: string) => ['task', id] as const,
  taskComments: (id: string) => ['taskComments', id] as const,
  taskAttachments: (id: string) => ['taskAttachments', id] as const,
  activity: ['activity'] as const,
  users: ['users'] as const,
  workspaceAttachments: ['workspaceAttachments'] as const,
}

export function createDemoSession() {
  return postData<DemoSession>('/api/demo/sessions', {})
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => getData<Dashboard>('/api/dashboard'),
  })
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => getPagedItems<Project>('/api/projects?pageSize=100'),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => getData<Project>(`/api/projects/${id}`),
    enabled: !!id,
  })
}

export function useProjectSummary(id: string) {
  return useQuery({
    queryKey: queryKeys.projectSummary(id),
    queryFn: () => getData<ProjectSummary>(`/api/projects/${id}/summary`),
    enabled: !!id,
  })
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.projectMembers(id),
    queryFn: () => getData<ProjectMember[]>(`/api/projects/${id}/members`),
    enabled: !!id,
  })
}

export function useProjectActivity(id: string) {
  return useQuery({
    queryKey: queryKeys.projectActivity(id),
    queryFn: () => getData<AuditLog[]>(`/api/projects/${id}/activity`),
    enabled: !!id,
  })
}

export function useTasks(projectId?: string, filters?: TaskFilters) {
  const params = new URLSearchParams({ pageSize: '100' })
  if (projectId) params.set('projectId', projectId)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId)

  return useQuery({
    queryKey: queryKeys.tasks(projectId, filters),
    queryFn: () => getPagedItems<Task>(`/api/tasks?${params.toString()}`),
  })
}

export function useProjectLabels(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectLabels(projectId),
    queryFn: () => getData<Label[]>(`/api/projects/${projectId}/labels`),
    enabled: !!projectId,
  })
}

export function useProjectAttachments(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectAttachments(projectId ?? ''),
    queryFn: () => getData<Attachment[]>(`/api/projects/${projectId}/attachments`),
    enabled: !!projectId,
  })
}

export function useTaskAttachments(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.taskAttachments(taskId ?? ''),
    queryFn: () => getData<Attachment[]>(`/api/tasks/${taskId}/attachments`),
    enabled: !!taskId,
  })
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: queryKeys.task(id ?? ''),
    queryFn: () => getData<Task>(`/api/tasks/${id}`),
    enabled: !!id,
  })
}

export function useTaskComments(id: string | null) {
  return useQuery({
    queryKey: queryKeys.taskComments(id ?? ''),
    queryFn: () => getData<Comment[]>(`/api/tasks/${id}/comments`),
    enabled: !!id,
  })
}

export function useActivity() {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: () => getPagedItems<AuditLog>('/api/activity?pageSize=100'),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => getPagedItems<User>('/api/users?pageSize=100'),
  })
}

export function useWorkspaceAttachments() {
  return useQuery({
    queryKey: queryKeys.workspaceAttachments,
    queryFn: () => getPagedItems<WorkspaceAttachment>('/api/attachments?pageSize=100'),
  })
}

function invalidateTaskQueries(queryClient: ReturnType<typeof useQueryClient>, projectId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  queryClient.invalidateQueries({ queryKey: queryKeys.activity })
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.projectSummary(projectId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
  }
}

function replaceTask(tasks: Task[] | undefined, updatedTask: Task) {
  if (!tasks) return tasks

  return tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
}

function updateTaskCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedTask: Task,
  projectId: string,
) {
  queryClient.setQueryData(queryKeys.task(updatedTask.id), updatedTask)
  queryClient.setQueryData<Task[]>(queryKeys.tasks(projectId), (tasks) =>
    replaceTask(tasks, updatedTask),
  )
  queryClient.setQueryData<Task[]>(queryKeys.tasks(), (tasks) =>
    replaceTask(tasks, updatedTask),
  )
  // Refetch the detail so server-derived fields (edit attribution) refresh.
  queryClient.invalidateQueries({ queryKey: queryKeys.task(updatedTask.id) })
}

function toastMutationError(error: unknown) {
  toast.error(getMutationErrorMessage(error) ?? 'Something went wrong.')
}

type TaskPatch = Partial<Pick<Task, 'status' | 'assigneeId' | 'assigneeName'>>

// Applies a patch to every cache holding the task and returns a rollback.
async function optimisticallyPatchTask(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  projectId: string,
  patch: TaskPatch,
) {
  await queryClient.cancelQueries({ queryKey: queryKeys.task(taskId) })
  await queryClient.cancelQueries({ queryKey: ['tasks'] })

  const previousTask = queryClient.getQueryData<Task>(queryKeys.task(taskId))
  const previousProjectTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectId))
  const previousAllTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks())

  const patchList = (tasks: Task[] | undefined) =>
    tasks?.map((task) => (task.id === taskId ? { ...task, ...patch } : task))

  if (previousTask) {
    queryClient.setQueryData(queryKeys.task(taskId), { ...previousTask, ...patch })
  }
  queryClient.setQueryData<Task[]>(queryKeys.tasks(projectId), patchList)
  queryClient.setQueryData<Task[]>(queryKeys.tasks(), patchList)

  return () => {
    if (previousTask) queryClient.setQueryData(queryKeys.task(taskId), previousTask)
    queryClient.setQueryData(queryKeys.tasks(projectId), previousProjectTasks)
    queryClient.setQueryData(queryKeys.tasks(), previousAllTasks)
  }
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { displayName: string; avatarColor?: string }) =>
      putData<User>('/api/users/me', body),
    onSuccess: () => {
      toast.success('Profile updated.')
      // The display name is baked into users, activity messages, comments,
      // and task assignee fields, so refresh everything.
      queryClient.invalidateQueries()
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; description?: string; status?: string; icon?: string; color?: string }) =>
      postData<Project>('/api/projects', body),
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function addProjectMember(projectId: string, body: { userId: string; role: string }) {
  return postData<Record<string, never>>(`/api/projects/${projectId}/members`, body)
}

export function uploadProjectAttachment(projectId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return postFormData<Attachment>(`/api/projects/${projectId}/attachments`, formData)
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => deleteData<Record<string, never>>(`/api/projects/${projectId}`),
    onError: toastMutationError,
    onSuccess: (_data, projectId) => {
      toast.success('Project deleted.')
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      queryClient.removeQueries({ queryKey: queryKeys.project(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectSummary(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectMembers(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectActivity(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectAttachments(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.tasks(projectId) })
    },
  })
}

function invalidateProjectMemberQueries(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects })
  queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.activity })
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) })
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { userId: string; role: string }) => addProjectMember(projectId, body),
    onSuccess: () => {
      toast.success('Member added.')
      invalidateProjectMemberQueries(queryClient, projectId)
    },
  })
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      deleteData<Record<string, never>>(`/api/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Member removed.')
      invalidateProjectMemberQueries(queryClient, projectId)
    },
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      title: string
      description?: string
      priority: string
      assigneeId: string
      dueDateUtc?: string
    }) =>
      postData<Task>('/api/tasks', {
        projectId,
        ...body,
      }),
    onSuccess: (task) => {
      toast.success(`Task "${task.title}" created.`)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function attachTaskLabel(taskId: string, labelId: string) {
  return postData<Task>(`/api/tasks/${taskId}/labels`, { labelId })
}

export function changeTaskStatus(taskId: string, status: string) {
  return patchData<Task>(`/api/tasks/${taskId}/status`, { status })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      name: string
      description?: string | null
      status: string
      icon?: string
      color?: string
    }) => putData<Project>(`/api/projects/${projectId}`, body),
    onError: toastMutationError,
    onSuccess: (project) => {
      toast.success('Project updated.')
      queryClient.setQueryData(queryKeys.project(projectId), project)
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    },
  })
}

export function useAttachLabel(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (labelId: string) => attachTaskLabel(taskId, labelId),
    onError: toastMutationError,
    onSuccess: (task) => {
      toast.success('Label added.')
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function useDetachLabel(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (labelId: string) => deleteData<Task>(`/api/tasks/${taskId}/labels/${labelId}`),
    onError: toastMutationError,
    onSuccess: (task) => {
      toast.success('Label removed.')
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function useUploadAttachment(taskId: string, projectId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return postFormData<Attachment>(`/api/tasks/${taskId}/attachments`, formData)
    },
    onError: toastMutationError,
    onSuccess: (attachment) => {
      toast.success(`"${attachment.fileName}" uploaded.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.taskAttachments(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    },
  })
}

export function useUploadProjectAttachment(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadProjectAttachment(projectId, file),
    onError: toastMutationError,
    onSuccess: (attachment) => {
      toast.success(`"${attachment.fileName}" uploaded.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.projectAttachments(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    },
  })
}

export function useDeleteProjectAttachment(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) =>
      deleteData<Record<string, never>>(`/api/projects/${projectId}/attachments/${attachmentId}`),
    onError: toastMutationError,
    onSuccess: () => {
      toast.success('Attachment deleted.')
      queryClient.invalidateQueries({ queryKey: queryKeys.projectAttachments(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    },
  })
}

export function useDeleteAttachment(taskId: string, projectId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) =>
      deleteData<Record<string, never>>(`/api/tasks/${taskId}/attachments/${attachmentId}`),
    onError: toastMutationError,
    onSuccess: () => {
      toast.success('Attachment deleted.')
      queryClient.invalidateQueries({ queryKey: queryKeys.taskAttachments(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(projectId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
    },
  })
}

export function uploadTaskAttachment(taskId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return postFormData<Attachment>(`/api/tasks/${taskId}/attachments`, formData)
}

export function useBoardStatusChange(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      changeTaskStatus(taskId, status),
    onMutate: ({ taskId, status }) =>
      optimisticallyPatchTask(queryClient, taskId, projectId, { status }),
    onError: (error, _vars, rollback) => {
      rollback?.()
      toastMutationError(error)
    },
    onSuccess: (task) => {
      toast.success(`Task moved to ${task.status.replace(/([A-Z])/g, ' $1').trim()}.`)
      updateTaskCaches(queryClient, task, projectId)
    },
    onSettled: () => invalidateTaskQueries(queryClient, projectId),
  })
}

export function useUpdateTaskStatus(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => changeTaskStatus(taskId, status),
    onMutate: (status) => optimisticallyPatchTask(queryClient, taskId, projectId, { status }),
    onError: (error, _status, rollback) => {
      rollback?.()
      toastMutationError(error)
    },
    onSuccess: (task) => {
      toast.success(`Task moved to ${task.status.replace(/([A-Z])/g, ' $1').trim()}.`)
      updateTaskCaches(queryClient, task, projectId)
    },
    onSettled: () => invalidateTaskQueries(queryClient, projectId),
  })
}

export function useAssignTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assigneeId: string | null) =>
      patchData<Task>(`/api/tasks/${taskId}/assign`, { assigneeId }),
    onMutate: (assigneeId) => {
      const members = queryClient.getQueryData<ProjectMember[]>(queryKeys.projectMembers(projectId))
      const assigneeName = assigneeId
        ? (members?.find((member) => member.userId === assigneeId)?.displayName ?? null)
        : null
      return optimisticallyPatchTask(queryClient, taskId, projectId, { assigneeId, assigneeName })
    },
    onError: (error, _assigneeId, rollback) => {
      rollback?.()
      toastMutationError(error)
    },
    onSuccess: (task) => {
      toast.success(task.assigneeName ? `Assigned to ${task.assigneeName}.` : 'Task unassigned.')
      updateTaskCaches(queryClient, task, projectId)
    },
    onSettled: () => invalidateTaskQueries(queryClient, projectId),
  })
}

export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      title: string
      description?: string
      priority: string
      dueDateUtc?: string | null
    }) => putData<Task>(`/api/tasks/${taskId}`, body),
    onSuccess: (task) => {
      toast.success('Task updated.')
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function addTaskComment(taskId: string, body: string) {
  return postData<Comment>(`/api/tasks/${taskId}/comments`, { body })
}

export function useAddComment(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addTaskComment(taskId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.taskComments(taskId) })
      const previousComments = queryClient.getQueryData<Comment[]>(queryKeys.taskComments(taskId))

      const optimisticComment: Comment = {
        id: `optimistic-${crypto.randomUUID()}`,
        taskId,
        authorId: '',
        authorName: 'You',
        body,
        createdAtUtc: new Date().toISOString(),
      }
      queryClient.setQueryData<Comment[]>(queryKeys.taskComments(taskId), (comments) => [
        ...(comments ?? []),
        optimisticComment,
      ])

      return () => queryClient.setQueryData(queryKeys.taskComments(taskId), previousComments)
    },
    onError: (error, _body, rollback) => {
      rollback?.()
      toastMutationError(error)
    },
    onSuccess: () => toast.success('Comment added.'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) })
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}
