import { NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/activity', label: 'Activity' },
]

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[#5c1713]/70 bg-[#170606]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/projectpulse-logo-horizontal.svg"
              alt="ProjectPulse"
              className="h-12 w-auto drop-shadow-[0_8px_24px_rgba(255,102,0,0.3)] sm:h-14"
            />
          </div>
          <nav className="flex flex-wrap justify-end gap-2">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-[#ff7b22]/50 bg-[#ff5a1f]/20 text-[#ffd3bd] shadow-[0_0_0_1px_rgba(255,122,34,0.15)]'
                      : 'border-transparent text-[#d8b2a7] hover:border-[#ff7b22]/30 hover:bg-[#2a0d0a] hover:text-[#fff1ea]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
