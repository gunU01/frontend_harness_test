import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { SpecList } from './pages/SpecList'
import { NewSpec } from './pages/NewSpec'
import { SpecEditor } from './pages/SpecEditor'
import { Settings } from './pages/Settings'
import { Community } from './pages/Community'
import { CommunityDetail } from './pages/CommunityDetail'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<CommunityDetail />} />
        <Route element={<PrivateRoute />}>
          <Route path="/specs" element={<SpecList />} />
          <Route path="/specs/new" element={<NewSpec />} />
          <Route path="/specs/:id" element={<SpecEditor />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
