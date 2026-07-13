export interface ApiResult<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
}

export interface DemoSession {
  sessionId: string
  userId: string
  expiresAtUtc: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: string
  createdAtUtc: string
  memberCount: number
  taskCount: number
  icon: string | null
  color: string | null
}

export interface ProjectSummary {
  id: string
  name: string
  totalTasks: number
  openTasks: number
  inProgressTasks: number
  doneTasks: number
  overdueTasks: number
}

export interface ProjectMember {
  userId: string
  displayName: string
  email: string
  role: string
}

export interface Label {
  id: string
  name: string
  color: string
}

export interface Attachment {
  id: string
  taskId: string | null
  projectId: string | null
  fileName: string
  contentType: string
  sizeBytes: number
  createdAtUtc: string
}

export interface Task {
  id: string
  projectId: string
  projectName: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDateUtc: string | null
  assigneeId: string | null
  assigneeName: string | null
  createdAtUtc: string
  updatedAtUtc: string | null
  lastEditedByName: string | null
  labels: Label[]
  attachmentCount: number
  attachmentFileNames: string[]
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  authorName: string
  body: string
  createdAtUtc: string
}

export interface AuditLog {
  id: string
  projectId: string
  taskId: string | null
  actorId: string
  actorName: string
  action: string
  entityType: string
  message: string
  createdAtUtc: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface Dashboard {
  totalProjects: number
  openTasks: number
  completedTasks: number
  overdueTasks: number
  teamMemberCount: number
  totalTasks: number
  tasksByStatus: StatusCount[]
  projectsByStatus: StatusCount[]
  recentActivity: AuditLog[]
}

export interface User {
  id: string
  displayName: string
  email: string
  projectCount: number
  assignedTaskCount: number
  avatarColor: string | null
}

export interface WorkspaceAttachment {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdAtUtc: string
  projectId: string
  projectName: string
  taskId: string | null
  taskTitle: string | null
}
