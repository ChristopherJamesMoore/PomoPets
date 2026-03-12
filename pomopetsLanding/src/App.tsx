import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import GameLayout from './components/GameLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import GameHomePage from './pages/GameHomePage'
import ShopPage from './pages/ShopPage'
import HealthPage from './pages/HealthPage'
import HabitsPage from './pages/HabitsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — game pages share the GameLayout (nav + main) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<GameLayout />}>
          <Route path="/home"     element={<GameHomePage />} />
          <Route path="/shop"     element={<ShopPage />} />
          <Route path="/health"   element={<HealthPage />} />
          <Route path="/habits"   element={<HabitsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
