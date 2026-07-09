import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Search,
  Settings,
  SquareCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useTasks } from '../api/queries'

interface PaletteItem {
  key: string
  group: 'Navigate' | 'Projects' | 'Tasks'
  icon: LucideIcon
  title: string
  subtitle?: string
  to: string
}

const navItems: Omit<PaletteItem, 'key' | 'group'>[] = [
  { icon: LayoutDashboard, title: 'Dashboard', to: '/' },
  { icon: FolderKanban, title: 'Projects', to: '/projects' },
  { icon: SquareCheck, title: 'Tasks', to: '/tasks' },
  { icon: Activity, title: 'Activity', to: '/activity' },
  { icon: CalendarDays, title: 'Calendar', to: '/calendar' },
  { icon: FileText, title: 'Documents', to: '/documents' },
  { icon: Users, title: 'Teams', to: '/teams' },
  { icon: BarChart3, title: 'Reports', to: '/reports' },
  { icon: Settings, title: 'Settings', to: '/settings' },
]

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: projects = [] } = useProjects()
  const { data: tasks = [] } = useTasks()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
        setQuery('')
        setActiveIndex(0)
      }
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpenEvent = () => {
      setOpen(true)
      setQuery('')
      setActiveIndex(0)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pp:open-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pp:open-palette', onOpenEvent)
    }
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase()
    const matches = (text: string) => !q || text.toLowerCase().includes(q)

    const nav: PaletteItem[] = navItems
      .filter((item) => matches(item.title))
      .map((item) => ({ ...item, key: `nav-${item.to}`, group: 'Navigate', subtitle: `Go to ${item.title}` }))

    const projectItems: PaletteItem[] = projects
      .filter((project) => matches(project.name))
      .slice(0, 6)
      .map((project) => ({
        key: `project-${project.id}`,
        group: 'Projects',
        icon: FolderKanban,
        title: project.name,
        subtitle: `${project.taskCount} tasks`,
        to: `/projects/${project.id}`,
      }))

    const taskItems: PaletteItem[] = q
      ? tasks
          .filter((task) => matches(`${task.title} ${task.projectName}`))
          .slice(0, 8)
          .map((task) => ({
            key: `task-${task.id}`,
            group: 'Tasks',
            icon: SquareCheck,
            title: task.title,
            subtitle: task.projectName,
            to: `/projects/${task.projectId}?taskId=${task.id}`,
          }))
      : []

    return q ? [...projectItems, ...taskItems, ...nav] : [...nav, ...projectItems]
  }, [query, projects, tasks])

  const clampedIndex = Math.min(activeIndex, Math.max(items.length - 1, 0))

  const close = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  const select = (item: PaletteItem) => {
    close()
    navigate(item.to)
  }

  if (!open) return null

  let lastGroup: string | null = null

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={close}
      />
      <div className="pp-card absolute left-1/2 top-24 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden p-0 shadow-2xl">
        <div className="flex items-center gap-3 border-b pp-divider px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#8e99ad]" aria-hidden />
          <input
            ref={inputRef}
            aria-label="Search projects, tasks, and pages"
            placeholder="Search projects, tasks, pages..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#f8fafc] outline-none placeholder:text-[#687387]"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((index) => Math.min(index + 1, items.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((index) => Math.max(index - 1, 0))
              }
              if (e.key === 'Enter' && items[clampedIndex]) {
                e.preventDefault()
                select(items[clampedIndex])
              }
            }}
          />
          <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[#8e99ad]">
            Esc
          </span>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[#8e99ad]">
              Nothing matches "{query}".
            </p>
          ) : (
            items.map((item, index) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              const active = index === clampedIndex

              return (
                <div key={item.key}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => select(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      active ? 'bg-[#ff7b22]/15 text-[#fff7ed]' : 'text-[#a9b1c0] hover:bg-white/[0.05]'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#ffb36c]' : 'text-[#687387]'}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-[#8e99ad]">{item.subtitle}</span>
                      )}
                    </span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
