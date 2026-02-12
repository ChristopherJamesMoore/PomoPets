import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  onlyIncomplete?: boolean;
}

export default function ProtectedRoute({ onlyIncomplete = false }: ProtectedRouteProps) {
  const { user, loading, isProfileComplete } = useAuth();

  if (loading) {
    return <div className="page-content"><p>Loading...</p></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onlyIncomplete && !isProfileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (onlyIncomplete && isProfileComplete) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
