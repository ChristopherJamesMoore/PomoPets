import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import GameLayout from './components/GameLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import GameHomePage from './pages/GameHomePage'
import ShopPage from './pages/ShopPage'
import HealthPage from './pages/HealthPage'
import HabitsPage from './pages/HabitsPage'
import PomodoroPage from './pages/PomodoroPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Profile setup — protected but outside GameLayout (no nav) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile-setup" element={<ProfileSetupPage />} />

        {/* Game pages share the GameLayout (nav + main) */}
        <Route element={<GameLayout />}>
          <Route path="/home"     element={<GameHomePage />} />
          <Route path="/shop"     element={<ShopPage />} />
          <Route path="/health"   element={<HealthPage />} />
          <Route path="/habits"   element={<HabitsPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
