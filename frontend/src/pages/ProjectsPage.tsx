import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreateProject, useProjects } from '../api/queries'

export function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const createProject = useCreateProject()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  if (isLoading) return <p className="text-slate-400">Loading projects…</p>
  if (error) return <p className="text-rose-400">Failed to load projects.</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="mt-1 text-slate-400">{projects.length} projects in the workspace</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Cancel' : 'New project'}
        </button>
      </div>

      {showForm && (
        <form
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
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
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Description (optional)"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Create project
          </button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-indigo-500/50 hover:bg-slate-900"
          >
            <h3 className="font-semibold text-white">{project.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">
              {project.description || 'No description'}
            </p>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span>{project.taskCount} tasks</span>
              <span>{project.memberCount} members</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
