import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, FolderPlus, ListChecks, Paperclip, Plus, Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  addProjectMember,
  queryKeys,
  uploadProjectAttachment,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUsers,
} from '../api/queries'
import type { User } from '../api/types'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { ProjectGridSkeleton } from '../components/Skeleton'
import { ProjectIconTile } from '../components/ProjectIconTile'
import { Badge, Button, Card } from '../components/ui'
import { getMutationErrorMessage } from '../lib/errors'
import { lightenColor, projectColorOptions, projectIconOptions } from '../lib/projectIcons'
import { formatProjectStatus, projectStatuses, projectStatusTone } from '../lib/projectStatus'
import { projectRoles, type ProjectRole } from '../lib/roles'

const defaultDemoAdminEmail = 'jeremy.demo@projectpulse.local'

interface SelectedMember {
  userId: string
  role: ProjectRole
}

function findDefaultDemoAdmin(users: User[]) {
  return users.find((user) => user.email === defaultDemoAdminEmail)
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { data: projects = [], isLoading, error } = useProjects()
  const { data: users = [] } = useUsers()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Active')
  const [icon, setIcon] = useState(projectIconOptions[0].name)
  const [color, setColor] = useState(projectColorOptions[0])
  // Deep link from the dashboard's New Project action.
  const [showForm, setShowForm] = useState(() => searchParams.get('create') === '1')
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<ProjectRole>('Member')
  const [formError, setFormError] = useState<string | null>(null)
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const [isFinalizingProject, setIsFinalizingProject] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null)

  const defaultDemoAdmin = useMemo(() => findDefaultDemoAdmin(users), [users])
  const selectedMembersWithDefault = useMemo(() => {
    const extraMembers = defaultDemoAdmin
      ? selectedMembers.filter((member) => member.userId !== defaultDemoAdmin.id)
      : selectedMembers

    return defaultDemoAdmin
      ? [{ userId: defaultDemoAdmin.id, role: 'Admin' as const }, ...extraMembers]
      : extraMembers
  }, [defaultDemoAdmin, selectedMembers])
  const selectedMemberIds = useMemo(
    () => new Set(selectedMembersWithDefault.map((member) => member.userId)),
    [selectedMembersWithDefault],
  )
  const selectedMemberRows = selectedMembersWithDefault
    .map((member) => ({
      ...member,
      user: users.find((user) => user.id === member.userId),
    }))
    .filter((member): member is SelectedMember & { user: User } => Boolean(member.user))
  const availableUsers = users.filter((user) => !selectedMemberIds.has(user.id))
  const adminCount = selectedMembersWithDefault.filter((member) => member.role === 'Admin').length
  const isSubmittingProject = createProject.isPending || isAddingMembers || isFinalizingProject
  const canCreateProject = name.trim().length > 0 && adminCount > 0 && !isSubmittingProject

  const resetForm = () => {
    setName('')
    setDescription('')
    setStatus('Active')
    setIcon(projectIconOptions[0].name)
    setColor(projectColorOptions[0])
    setMemberUserId('')
    setMemberRole('Member')
    setFormError(null)
    setSelectedMembers([])
    setProjectFiles([])
  }

  const handleToggleForm = () => {
    if (showForm) {
      resetForm()
      setShowForm(false)
    } else {
      setFormError(null)
      setSelectedMembers([])
      setShowForm(true)
    }
  }

  const handleAddMemberSelection = () => {
    if (!memberUserId || selectedMemberIds.has(memberUserId)) return

    setSelectedMembers((members) => [...members, { userId: memberUserId, role: memberRole }])
    setMemberUserId('')
    setMemberRole('Member')
    setFormError(null)
  }

  const handleRemoveMemberSelection = (userId: string) => {
    if (userId === defaultDemoAdmin?.id) return

    setSelectedMembers((members) => members.filter((member) => member.userId !== userId))
  }

  const handleMemberRoleChange = (userId: string, role: ProjectRole) => {
    setSelectedMembers((members) =>
      members.map((member) => (member.userId === userId ? { ...member, role } : member)),
    )
  }

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (adminCount === 0) {
      setFormError('At least one Admin is required before a project can be created.')
      return
    }

    try {
      setFormError(null)
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        icon,
        color,
      })
      setIsFinalizingProject(true)

      const membersToAdd = selectedMembersWithDefault.filter(
        (member) => member.userId !== defaultDemoAdmin?.id,
      )

      if (membersToAdd.length > 0) {
        setIsAddingMembers(true)
        await Promise.all(
          membersToAdd.map((member) =>
            addProjectMember(project.id, { userId: member.userId, role: member.role }),
          ),
        )
      }

      for (const file of projectFiles) {
        await uploadProjectAttachment(project.id, file)
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectAttachments(project.id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectActivity(project.id) })
      setShowForm(false)
      resetForm()
    } catch (mutationError) {
      setFormError(getMutationErrorMessage(mutationError))
    } finally {
      setIsAddingMembers(false)
      setIsFinalizingProject(false)
    }
  }

  if (isLoading) {
    return (
      <div className="pp-page-shell">
        <div className="pp-page-header">
          <div>
            <p className="pp-eyebrow">Workspace</p>
            <h1 className="pp-title">Projects</h1>
          </div>
        </div>
        <ProjectGridSkeleton />
      </div>
    )
  }
  if (error) return <p className="text-sm font-medium text-[#fecaca]">Failed to load projects.</p>

  return (
    <div className="pp-page-shell">
      <div className="pp-page-header">
        <div>
          <p className="pp-eyebrow">Workspace</p>
          <h1 className="pp-title">Projects</h1>
          <p className="pp-subtitle mt-2">{projects.length} projects in the workspace</p>
        </div>
        <Button
          type="button"
          onClick={handleToggleForm}
          variant={showForm ? 'secondary' : 'primary'}
        >
          {!showForm && <Plus className="h-4 w-4" aria-hidden />}
          {showForm ? 'Cancel' : 'New project'}
        </Button>
      </div>

      {showForm && (
        <form
          className="pp-card space-y-6 p-5 sm:p-6"
          onSubmit={handleCreateProject}
        >
          {formError && (
            <p className="rounded-xl border border-[#f87171]/35 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
              {formError}
            </p>
          )}

          <section className="space-y-4">
            <div>
              <p className="pp-eyebrow">Step 1</p>
              <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Project details</h3>
              <p className="mt-1 text-sm text-[#8e99ad]">Set the basic intake fields before inviting the team.</p>
            </div>
            <div>
              <label className="pp-label">
                Project name
                <input
                  required
                  maxLength={200}
                  placeholder="Customer onboarding portal"
                  className="pp-input text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </div>
            <label className="pp-label">
              Description
              <textarea
                maxLength={1800}
                rows={4}
                placeholder="Scope, outcomes, risks, or launch context"
                className="pp-textarea resize-y text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="pp-label sm:max-w-xs">
              Status
              <select
                className="pp-select text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {projectStatuses.map((option) => (
                  <option key={option} value={option}>
                    {formatProjectStatus(option)}
                  </option>
                ))}
              </select>
            </label>
            <div className="pp-label">
              Icon
              <div role="radiogroup" aria-label="Project icon" className="flex flex-wrap gap-2">
                {projectIconOptions.map((option) => {
                  const selected = option.name === icon
                  const OptionIcon = option.icon

                  return (
                    <button
                      key={option.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${option.label} icon`}
                      title={option.label}
                      onClick={() => setIcon(option.name)}
                      className={`flex h-11 w-11 items-center justify-center rounded-[0.85rem] border text-white transition ${
                        selected
                          ? 'border-white/40 ring-2 ring-[#ff7b22]/60 ring-offset-2 ring-offset-[#0a0d13]'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${color}, ${lightenColor(color)})` }}
                    >
                      <OptionIcon className="h-5 w-5" aria-hidden />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="pp-label">
              Color
              <div role="radiogroup" aria-label="Project color" className="flex flex-wrap items-center gap-2">
                {projectColorOptions.map((option) => {
                  const selected = option === color

                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Color ${option}`}
                      onClick={() => setColor(option)}
                      className={`h-8 w-8 rounded-full border transition ${
                        selected
                          ? 'border-white/70 ring-2 ring-white/30 ring-offset-2 ring-offset-[#0a0d13]'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${option}, ${lightenColor(option)})` }}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pp-divider pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="pp-eyebrow">Step 2</p>
                <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Members</h3>
                <p className="mt-1 text-sm text-[#8e99ad]">At least one Admin is required.</p>
              </div>
              <Badge tone={adminCount > 0 ? 'green' : 'red'}>
                {adminCount} Admin{adminCount === 1 ? '' : 's'}
              </Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
              <select
                aria-label="Select existing user"
                className="pp-select min-w-0 text-sm"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                disabled={availableUsers.length === 0}
              >
                <option value="" disabled>
                  Select existing user
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} · {user.email}
                  </option>
                ))}
              </select>
              <select
                aria-label="Member role"
                className="pp-select text-sm"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as ProjectRole)}
              >
                {projectRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!memberUserId}
                onClick={handleAddMemberSelection}
                className="pp-button-secondary"
              >
                Add member
              </button>
            </div>

            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {selectedMemberRows.map((member) => {
                const isDefaultAdmin = member.userId === defaultDemoAdmin?.id

                return (
                  <li
                    key={member.userId}
                    className="grid gap-3 bg-white/[0.025] p-3 sm:grid-cols-[1fr_160px_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#f8fafc]">{member.user.displayName}</p>
                      <p className="truncate text-xs text-[#8e99ad]">
                        {member.user.email}
                        {isDefaultAdmin ? ' · Default demo admin' : ''}
                      </p>
                    </div>
                    <select
                      aria-label={`${member.user.displayName} role`}
                      disabled={isDefaultAdmin}
                      className="pp-select text-sm"
                      value={member.role}
                      onChange={(e) => handleMemberRoleChange(member.userId, e.target.value as ProjectRole)}
                    >
                      {projectRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isDefaultAdmin}
                      onClick={() => handleRemoveMemberSelection(member.userId)}
                      className="pp-button-danger min-h-0 px-3 py-2"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="space-y-3 border-t pp-divider pt-5">
            <div>
              <p className="pp-eyebrow">Step 3</p>
              <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Project files</h3>
            </div>
            <div className="rounded-xl border border-dashed border-[#ff7b22]/35 bg-[#ff7b22]/[0.035] p-4">
              <label className="pp-button-secondary cursor-pointer">
                <Paperclip className="h-4 w-4" aria-hidden />
                Choose files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.gif,.pdf,.txt,.md,.csv,.json,.xlsx,.docx,.zip"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? [])
                    setProjectFiles((files) => [...files, ...selected])
                    e.target.value = ''
                  }}
                />
              </label>
              {projectFiles.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {projectFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-sm text-[#cbd5e1]">
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        className="pp-button-ghost min-h-0 px-2 py-0.5 text-xs"
                        onClick={() => setProjectFiles((files) => files.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t pp-divider pt-5">
            <Button
              type="button"
              onClick={handleToggleForm}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canCreateProject}
            >
              {isSubmittingProject ? 'Creating...' : 'Create project'}
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} interactive className="group flex min-h-[15rem] flex-col p-5 sm:p-6">
            <Link to={`/projects/${project.id}`} className="flex flex-1 flex-col">
              <ProjectIconTile projectId={project.id} icon={project.icon} color={project.color} />
              <div className="mt-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-bold text-[#f8fafc] transition group-hover:text-[#fed7aa]">
                    {project.name}
                  </h2>
                  <Badge tone={projectStatusTone(project.status)}>{formatProjectStatus(project.status)}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-[#a9b1c0]">
                  {project.description || 'No description'}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                <div className="flex flex-wrap gap-4 text-sm text-[#8e99ad]">
                  <span className="inline-flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4" aria-hidden />
                    {project.taskCount} tasks
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" aria-hidden />
                    {project.memberCount} members
                  </span>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-[#a9b1c0] transition group-hover:border-[#ff7b22]/45 group-hover:bg-[#ff7b22]/15 group-hover:text-[#fed7aa]">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </Link>
            <div className="mt-5 flex justify-end border-t pp-divider pt-4">
              <button
                type="button"
                disabled={deleteProject.isPending}
                onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                className="pp-button-danger min-h-0 px-3 py-2 text-xs"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <EmptyState
          icon={FolderPlus}
          title="No projects yet"
          description="Create your first project to start organizing tasks, members, and activity."
          action={
            <Button type="button" onClick={handleToggleForm}>
              <Plus className="h-4 w-4" aria-hidden />
              New project
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={projectToDelete !== null}
        title="Delete project?"
        description={`"${projectToDelete?.name}" and all of its tasks will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete project"
        isPending={deleteProject.isPending}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (!projectToDelete) return
          deleteProject.mutate(projectToDelete.id, {
            onSuccess: () => setProjectToDelete(null),
          })
        }}
      />
    </div>
  )
}
