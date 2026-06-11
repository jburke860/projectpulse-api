import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteData, getData, patchData, postData, putData } from './client'
import type {
  AuditLog,
  Comment,
  Dashboard,
  DemoSession,
  Project,
  ProjectMember,
  ProjectSummary,
  Task,
  User,
} from './types'

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  projectSummary: (id: string) => ['projectSummary', id] as const,
  projectMembers: (id: string) => ['projectMembers', id] as const,
  projectActivity: (id: string) => ['projectActivity', id] as const,
  tasks: (projectId?: string) => ['tasks', projectId ?? 'all'] as const,
  task: (id: string) => ['task', id] as const,
  taskComments: (id: string) => ['taskComments', id] as const,
  activity: ['activity'] as const,
  users: ['users'] as const,
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
    queryFn: () => getData<Project[]>('/api/projects'),
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

export function useTasks(projectId?: string) {
  const params = projectId ? `?projectId=${projectId}` : ''
  return useQuery({
    queryKey: queryKeys.tasks(projectId),
    queryFn: () => getData<Task[]>(`/api/tasks${params}`),
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
    queryFn: () => getData<AuditLog[]>('/api/activity?limit=100'),
  })
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => getData<User[]>('/api/users'),
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
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      postData<Project>('/api/projects', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => deleteData<Record<string, never>>(`/api/projects/${projectId}`),
    onSuccess: (_data, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      queryClient.invalidateQueries({ queryKey: queryKeys.activity })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
      queryClient.removeQueries({ queryKey: queryKeys.project(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectSummary(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectMembers(projectId) })
      queryClient.removeQueries({ queryKey: queryKeys.projectActivity(projectId) })
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
    mutationFn: (body: { userId: string; role: string }) =>
      postData<Record<string, never>>(`/api/projects/${projectId}/members`, body),
    onSuccess: () => invalidateProjectMemberQueries(queryClient, projectId),
  })
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      deleteData<Record<string, never>>(`/api/projects/${projectId}/members/${userId}`),
    onSuccess: () => invalidateProjectMemberQueries(queryClient, projectId),
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
    onSuccess: () => invalidateTaskQueries(queryClient, projectId),
  })
}

export function useUpdateTaskStatus(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: string) =>
      patchData<Task>(`/api/tasks/${taskId}/status`, { status }),
    onSuccess: (task) => {
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function useAssignTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assigneeId: string | null) =>
      patchData<Task>(`/api/tasks/${taskId}/assign`, { assigneeId }),
    onSuccess: (task) => {
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
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
      updateTaskCaches(queryClient, task, projectId)
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}

export function useAddComment(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      postData<Comment>(`/api/tasks/${taskId}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) })
      invalidateTaskQueries(queryClient, projectId)
    },
  })
}
