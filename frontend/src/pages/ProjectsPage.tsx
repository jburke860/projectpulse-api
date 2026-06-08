import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateProject, useDeleteProject, useProjects } from '../api/queries'

export function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

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
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-gradient-to-r from-[#d92d20] to-[#ff8a1c] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(255,106,26,0.25)] hover:from-[#e03a21] hover:to-[#ff9a2e]"
        >
          {showForm ? 'Cancel' : 'New project'}
        </button>
      </div>

      {showForm && (
        <form
          className="rounded-xl border border-[#5b1714] bg-[#230907]/85 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]"
          onSubmit={(e) => {
            e.preventDefault()
            createProject.mutate(
              { name, description: description || undefined },
              {
                onSuccess: () => {
                  setName('')
                  setDescription('')
                  setShowForm(false)
                },
              },
            )
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Project name"
              className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Description (optional)"
              className="rounded-lg border border-[#5a1914] bg-[#24100d] px-3 py-2 text-sm text-[#fff4ef] outline-none placeholder:text-[#9d6a5d] focus:border-[#ff7b22]/60"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-gradient-to-r from-[#ff7b22] to-[#ffb347] px-4 py-2 text-sm font-medium text-[#2b0908] shadow-[0_12px_28px_rgba(255,122,34,0.22)] hover:from-[#ff8a1c] hover:to-[#ffd06d]"
          >
            Create project
          </button>
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
