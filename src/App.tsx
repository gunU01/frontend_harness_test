import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })))
const SpecList = lazy(() => import('./pages/SpecList').then((m) => ({ default: m.SpecList })))
const NewSpec = lazy(() => import('./pages/NewSpec').then((m) => ({ default: m.NewSpec })))
const ProjectDetail = lazy(() =>
  import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail }))
)
const SpecEditor = lazy(() => import('./pages/SpecEditor').then((m) => ({ default: m.SpecEditor })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })))
const CommunityDetail = lazy(() =>
  import('./pages/CommunityDetail').then((m) => ({ default: m.CommunityDetail }))
)
const Analytics = lazy(() => import('./pages/Analytics').then((m) => ({ default: m.Analytics })))

export default function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <main className="mx-auto max-w-3xl px-4 py-10 text-slate-500">불러오는 중...</main>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
          <Route element={<PrivateRoute />}>
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/projects/:projectId/specs/new" element={<NewSpec />} />
            <Route path="/specs" element={<SpecList />} />
            <Route path="/specs/new" element={<NewSpec />} />
            <Route path="/specs/:id" element={<SpecEditor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
