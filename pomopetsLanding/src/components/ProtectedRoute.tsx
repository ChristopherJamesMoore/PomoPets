import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, loading, isProfileComplete } = useAuth()
  const location = useLocation()

  if (loading) return <div className="app-loading"><div className="loading-paw">🐾</div></div>
  if (!user) return <Navigate to="/login" replace />
  // Only redirect when profile has loaded AND display_name is genuinely empty (new user)
  if (profile !== null && !isProfileComplete && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />
  }
  return <Outlet />
}
