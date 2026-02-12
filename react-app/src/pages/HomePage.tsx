import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, profile } = useAuth();

  return (
    <div className="page-content">
      <h1>Welcome To PomoPets!</h1>
      <p>An interactive study pet game!</p>
      {user ? (
        <p className="login-prompt">Welcome back, {profile?.display_name || 'User'}!</p>
      ) : (
        <p className="login-prompt">
          Don't forget to <Link to="/login">Login!</Link>
        </p>
      )}
    </div>
  );
}
