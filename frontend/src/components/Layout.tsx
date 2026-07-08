import { ExternalLink } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useDemoSession } from '../demo/DemoSessionContext'
import { cn } from '../lib/cn'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/activity', label: 'Activity' },
]

export function Layout() {
  const { apiDocsUrl, clearCurrentSession } = useDemoSession()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0d13]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/projectpulse-logo-horizontal.svg"
              alt="ProjectPulse"
              className="h-10 w-auto drop-shadow-[0_10px_28px_rgba(255,122,34,0.22)] sm:h-11"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <nav className="flex flex-wrap justify-end gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-semibold transition',
                      isActive
                        ? 'bg-[#ff7b22]/15 text-[#fff7ed] shadow-[inset_0_0_0_1px_rgba(255,122,34,0.35)]'
                        : 'text-[#a9b1c0] hover:bg-white/[0.06] hover:text-[#f8fafc]',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="pp-button-secondary min-h-0 px-3 py-2"
            >
              API Docs
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <button
              type="button"
              onClick={clearCurrentSession}
              className="pp-button-secondary min-h-0 px-3 py-2"
            >
              Clear and start new session
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[#8e99ad] sm:px-6">
          <p>© {new Date().getFullYear()} ProjectPulse</p>
          <nav className="flex flex-wrap items-center gap-5">
            <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="transition hover:text-[#f8fafc]">
              API Docs
            </a>
            <a
              href="https://github.com/jburke860/projectpulse-api"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[#f8fafc]"
            >
              GitHub
            </a>
            <NavLink to="/activity" className="transition hover:text-[#f8fafc]">
              Activity
            </NavLink>
            <NavLink to="/projects" className="transition hover:text-[#f8fafc]">
              Projects
            </NavLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
