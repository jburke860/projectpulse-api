import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { addProjectMember, queryKeys, useCreateProject, useDeleteProject, useProjects, useUsers } from '../api/queries'
import type { User } from '../api/types'
import { Badge, Button, Card } from '../components/ui'

const projectRoles = ['Admin', 'Member', 'Viewer'] as const
const defaultDemoAdminEmail = 'jeremy.demo@projectpulse.local'

type ProjectRole = (typeof projectRoles)[number]

interface SelectedMember {
  userId: string
  role: ProjectRole
}

function findDefaultDemoAdmin(users: User[]) {
  return users.find((user) => user.email === defaultDemoAdminEmail)
}

function getMutationErrorMessage(error: unknown) {
  if (!error) return null

  const response = (error as {
    response?: { data?: { errors?: string[]; message?: string } }
  }).response

  if (response?.data?.errors?.length) {
    return response.data.errors.join(' ')
  }

  if (response?.data?.message) {
    return response.data.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const { data: projects = [], isLoading, error } = useProjects()
  const { data: users = [] } = useUsers()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<ProjectRole>('Member')
  const [formError, setFormError] = useState<string | null>(null)
  const [isAddingMembers, setIsAddingMembers] = useState(false)

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
  const isSubmittingProject = createProject.isPending || isAddingMembers
  const canCreateProject = name.trim().length > 0 && adminCount > 0 && !isSubmittingProject

  const resetForm = () => {
    setName('')
    setDescription('')
    setMemberUserId('')
    setMemberRole('Member')
    setFormError(null)
    setSelectedMembers([])
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
      })

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

      await queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      setShowForm(false)
      resetForm()
    } catch (mutationError) {
      setFormError(getMutationErrorMessage(mutationError))
    } finally {
      setIsAddingMembers(false)
    }
  }

  const handleDeleteProject = (projectId: string, projectName: string) => {
    const confirmed = window.confirm(
      `Delete "${projectName}" and all of its tasks? This cannot be undone.`,
    )

    if (confirmed) {
      deleteProject.mutate(projectId)
    }
  }

  if (isLoading) return <p className="pp-subtitle">Loading projects...</p>
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
              <h3 className="mt-1 text-lg font-bold text-[#f8fafc]">Files</h3>
            </div>
            <div className="rounded-xl border border-dashed border-[#ff7b22]/35 bg-[#ff7b22]/[0.035] p-4">
              <button
                type="button"
                disabled
                className="pp-button-secondary opacity-60"
              >
                Upload files
              </button>
              <p className="mt-3 text-sm leading-6 text-[#8e99ad]">
                File attachments are planned for a future version. Hosted demo runs in a lightweight
                environment, so uploads are disabled.
              </p>
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

      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} interactive className="group flex min-h-[15rem] flex-col p-5 sm:p-6">
            <Link to={`/projects/${project.id}`} className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="pp-icon-tile text-lg font-black">
                  {project.name.charAt(0).toUpperCase()}
                </span>
                <Badge tone="green">Active</Badge>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-bold text-[#f8fafc] transition group-hover:text-[#fed7aa]">
                  {project.name}
                </h2>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-[#a9b1c0]">
                  {project.description || 'No description'}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-4 pt-8 text-sm text-[#8e99ad]">
                <span>{project.taskCount} tasks</span>
                <span>{project.memberCount} members</span>
              </div>
            </Link>
            <div className="mt-5 flex justify-end border-t pp-divider pt-4">
              <button
                type="button"
                disabled={deleteProject.isPending}
                onClick={() => handleDeleteProject(project.id, project.name)}
                className="pp-button-danger min-h-0 px-3 py-2 text-xs"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
