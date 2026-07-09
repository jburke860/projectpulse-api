import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BarChart3, FileText, Settings } from 'lucide-react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { ActivityPage } from './pages/ActivityPage'
import { CalendarPage } from './pages/CalendarPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { TasksPage } from './pages/TasksPage'
import { TeamsPage } from './pages/TeamsPage'
import { DemoSessionProvider } from './demo/DemoSessionProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(16, 19, 27, 0.97)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            color: '#f8fafc',
          },
        }}
      />
      <DemoSessionProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route
                path="documents"
                element={
                  <ComingSoonPage
                    icon={FileText}
                    eyebrow="Files"
                    title="Documents"
                    description="All files shared across the workspace."
                  />
                }
              />
              <Route path="teams" element={<TeamsPage />} />
              <Route
                path="reports"
                element={
                  <ComingSoonPage
                    icon={BarChart3}
                    eyebrow="Insights"
                    title="Reports"
                    description="Delivery health and progress across projects."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <ComingSoonPage
                    icon={Settings}
                    eyebrow="Workspace"
                    title="Settings"
                    description="Session details and workspace preferences."
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </DemoSessionProvider>
    </QueryClientProvider>
  )
}
