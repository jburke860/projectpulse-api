import { useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  SquareCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useDashboard } from '../api/queries'
import type { AuditLog } from '../api/types'
import { useDemoSession } from '../demo/DemoSessionContext'
import { cn } from '../lib/cn'
import { useEscapeToClose } from '../lib/useEscapeToClose'
import { Avatar } from './Avatar'
import { CommandPalette } from './CommandPalette'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: SquareCheck },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const DEMO_USER_NAME = 'Demo User'
const DEMO_USER_EMAIL = 'demo@projectpulse.io'

function formatBellTime(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return isToday ? time : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { apiDocsUrl, clearCurrentSession, userId } = useDemoSession()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-5">
        <img
          src="/projectpulse-logo-horizontal.svg"
          alt="ProjectPulse"
          className="h-9 w-auto drop-shadow-[0_10px_28px_rgba(255,122,34,0.22)]"
        />
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'bg-[#ff7b22]/15 text-[#fff7ed] shadow-[inset_0_0_0_1px_rgba(255,122,34,0.35)]'
                  : 'text-[#a9b1c0] hover:bg-white/[0.06] hover:text-[#f8fafc]',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[#f8fafc]">
            <Zap className="h-4 w-4 text-[#ffb36c]" aria-hidden />
            Upgrade to Pro
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8e99ad]">
            Unlock advanced features and analytics.
          </p>
          <button
            type="button"
            className="pp-button-secondary mt-3 min-h-0 w-full px-3 py-2 text-xs"
            onClick={() => toast('ProjectPulse is a demo. But thanks for the enthusiasm!')}
          >
            Upgrade Now
          </button>
        </div>

        <div className="relative">
          {userMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close user menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="pp-card absolute bottom-full left-0 z-50 mb-2 w-full space-y-1 p-2 shadow-2xl">
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#a9b1c0] transition hover:bg-white/[0.06] hover:text-[#f8fafc]"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  API Docs
                </a>
                <a
                  href="https://github.com/jburke860/projectpulse-api"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#a9b1c0] transition hover:bg-white/[0.06] hover:text-[#f8fafc]"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  GitHub
                </a>
                <button
                  type="button"
                  onClick={clearCurrentSession}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#fca5a5] transition hover:bg-[#ef4444]/10"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Clear and start new session
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            aria-expanded={userMenuOpen}
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
          >
            <Avatar name={DEMO_USER_NAME} id={userId || DEMO_USER_NAME} presence="online" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#f8fafc]">{DEMO_USER_NAME}</span>
              <span className="block truncate text-xs text-[#8e99ad]">{DEMO_USER_EMAIL}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#8e99ad]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationBell() {
  const navigate = useNavigate()
  const { data: dashboard } = useDashboard()
  const [open, setOpen] = useState(false)
  useEscapeToClose(() => setOpen(false), open)

  // Captured once per mount; fine for a cosmetic badge. Seeded demo activity
  // is backdated across recent days, so count the past week as "new".
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recent = dashboard?.recentActivity ?? []
  const freshCount = recent.filter((item) => new Date(item.createdAtUtc).getTime() >= weekAgo).length

  const jumpTo = (item: AuditLog) => {
    setOpen(false)
    if (item.taskId) {
      navigate(`/projects/${item.projectId}?taskId=${item.taskId}`)
      return
    }
    navigate(`/projects/${item.projectId}`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${freshCount > 0 ? ` (${freshCount} new)` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#a9b1c0] transition hover:text-[#f8fafc]"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {freshCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff7b22] px-1 text-[0.6rem] font-bold text-[#1a1005]">
            {freshCount > 9 ? '9+' : freshCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="pp-card absolute right-0 top-full z-50 mt-2 w-80 p-2 shadow-2xl">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8e99ad]">
              Recent activity
            </p>
            {recent.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#8e99ad]">Nothing new yet.</p>
            ) : (
              <ul>
                {recent.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(item)}
                      className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7b22]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[#f8fafc]">{item.message}</span>
                        <span className="mt-0.5 block text-xs text-[#8e99ad]">
                          {formatBellTime(item.createdAtUtc)} · {item.actorName}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <NavLink
              to="/activity"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold text-[#ffb36c] transition hover:bg-white/[0.06]"
            >
              View all activity
            </NavLink>
          </div>
        </>
      )}
    </div>
  )
}

export function Layout() {
  const { userId } = useDemoSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEscapeToClose(() => setDrawerOpen(false), drawerOpen)

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('pp:open-palette'))
  }

  return (
    <div className="min-h-screen">
      <CommandPalette />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/10 bg-[#0a0d13]/90 lg:block">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-[#0a0d13] shadow-2xl">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-[#8e99ad] transition hover:text-[#f8fafc]"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0d13]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#a9b1c0] transition hover:text-[#f8fafc] lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={openPalette}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-[#687387] transition hover:border-white/20 hover:text-[#8e99ad] sm:max-w-md"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Search projects, tasks, docs...</span>
              <span className="ml-auto hidden shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[#8e99ad] sm:block">
                {navigator.platform.toLowerCase().includes('mac') ? '⌘K' : 'Ctrl K'}
              </span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <Avatar name={DEMO_USER_NAME} id={userId || DEMO_USER_NAME} size="md" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <Outlet />
        </main>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[#8e99ad] sm:px-6">
            <p>© {new Date().getFullYear()} ProjectPulse</p>
            <p className="text-xs">Created by Jeremy Burke</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
