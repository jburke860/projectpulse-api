import { useMemo, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { addProjectMember, queryKeys, useCreateProject, useDeleteProject, useProjects, useUsers } from '../api/queries'
import type { User } from '../api/types'

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

  if (isLoading) return <p className="text-[#d8a290]">Loading projects…</p>
  if (error) return <p className="text-[#ff8d7d]">Failed to load projects.</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#fff6f2]">Projects</h2>
          <p className="mt-1 text-[#d8a290]">{projects.length} projects in the workspace</p>
        </div>
        <button
          type="button"
          onClick={handleToggleForm}
          className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e]"
        >
          {showForm ? 'Cancel' : 'New project'}
        </button>
      </div>

      {showForm && (
        <form
          className="space-y-6 rounded-xl border border-[#5b1714] bg-[#230907]/85 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
          onSubmit={handleCreateProject}
        >
          {formError && (
            <p className="rounded-lg border border-[#ff5a1f]/40 bg-[#ff5a1f]/10 px-3 py-2 text-sm text-[#ffd1c4]">
              {formError}
            </p>
          )}

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#fff6f2]">Project details</h3>
              <p className="mt-1 text-sm text-[#c99182]">Set the basic intake fields before inviting the team.</p>
            </div>
            <div>
              <label className="grid gap-2 text-sm text-[#e8b9aa]">
                Project name
                <input
                  required
                  maxLength={200}
                  placeholder="Customer onboarding portal"
                  className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-[#e8b9aa]">
              Description
              <textarea
                maxLength={1800}
                rows={4}
                placeholder="Scope, outcomes, risks, or launch context"
                className="resize-y rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </section>

          <section className="space-y-4 border-t border-[#5b1714] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#fff6f2]">Members</h3>
                <p className="mt-1 text-sm text-[#c99182]">At least one Admin is required.</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  adminCount > 0
                    ? 'border-[#ffb347]/35 bg-[#ffb347]/10 text-[#ffe1b0]'
                    : 'border-[#ff5a1f]/45 bg-[#ff5a1f]/10 text-[#ffd0c1]'
                }`}
              >
                {adminCount} Admin{adminCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
              <select
                aria-label="Select existing user"
                className="min-w-0 rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60"
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
                className="rounded-lg border border-[#ff7b22]/35 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add member
              </button>
            </div>

            <ul className="divide-y divide-[#5b1714] overflow-hidden rounded-lg border border-[#5b1714]">
              {selectedMemberRows.map((member) => {
                const isDefaultAdmin = member.userId === defaultDemoAdmin?.id

                return (
                  <li
                    key={member.userId}
                    className="grid gap-3 bg-[#1e0806]/60 p-3 sm:grid-cols-[1fr_160px_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#fff0e8]">{member.user.displayName}</p>
                      <p className="truncate text-xs text-[#c99182]">
                        {member.user.email}
                        {isDefaultAdmin ? ' · Default demo admin' : ''}
                      </p>
                    </div>
                    <select
                      aria-label={`${member.user.displayName} role`}
                      disabled={isDefaultAdmin}
                      className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none focus:border-[#ff7b22]/60 disabled:cursor-not-allowed disabled:opacity-70"
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
                      className="rounded-lg border border-[#ff5a1f]/35 px-3 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="space-y-3 border-t border-[#5b1714] pt-5">
            <h3 className="text-lg font-semibold text-[#fff6f2]">Files</h3>
            <div className="rounded-lg border border-dashed border-[#ff7b22]/35 bg-[#1e0806]/60 p-4">
              <button
                type="button"
                disabled
                className="rounded-lg border border-[#ff7b22]/25 px-4 py-2 text-sm font-medium text-[#b88172] opacity-70"
              >
                Upload files
              </button>
              <p className="mt-3 text-sm leading-6 text-[#c99182]">
                File attachments are planned for a future version. Hosted demo runs in a lightweight
                environment, so uploads are disabled.
              </p>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[#5b1714] pt-5">
            <button
              type="button"
              onClick={handleToggleForm}
              className="rounded-lg border border-[#ff7b22]/35 px-4 py-2 text-sm font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreateProject}
              className="rounded-lg bg-gradient-to-r from-[#ff7b22] to-[#ffb347] px-4 py-2 text-sm font-medium text-[#2b0908] shadow-[0_12px_28px_rgba(255,122,34,0.22)] hover:from-[#ff8a1c] hover:to-[#ffd06d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingProject ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-5 transition hover:border-[#ff7b22]/45 hover:bg-[#2a0d0a] hover:shadow-[0_18px_42px_rgba(0,0,0,0.24)]"
          >
            <Link to={`/projects/${project.id}`} className="block">
              <h3 className="font-semibold text-[#fff6f2]">{project.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[#d8a290]">
                {project.description || 'No description'}
              </p>
            </Link>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-4 text-xs text-[#c99182]">
                <span>{project.taskCount} tasks</span>
                <span>{project.memberCount} members</span>
              </div>
              <button
                type="button"
                disabled={deleteProject.isPending}
                onClick={() => handleDeleteProject(project.id, project.name)}
                className="rounded-lg border border-[#ff5a1f]/40 px-3 py-1.5 text-xs font-medium text-[#ffd0c1] hover:border-[#ff8d7d] hover:bg-[#ff5a1f]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
