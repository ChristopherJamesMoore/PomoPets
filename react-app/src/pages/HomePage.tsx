import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardCard from '../components/DashboardCard';
import './HomePage.css';

export default function HomePage() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="landing">
        <h1>PomoPets</h1>
        <p>An interactive study pet game!</p>
        <div className="mascot-row" aria-hidden="true">
          <img src="/bunny.png" alt="" className="mascot-image" />
          <img src="/turtle.png" alt="" className="mascot-image" />
        </div>
        <Link to="/login" className="landing-btn">Get Started</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome back, {profile?.display_name || 'User'}!</h1>
      <p className="dashboard-subtitle">What would you like to do today?</p>
      <div className="mascot-row" aria-hidden="true">
        <img src="/bunny.png" alt="" className="mascot-image" />
        <img src="/turtle.png" alt="" className="mascot-image" />
      </div>

      <div className="dashboard-grid">
        <DashboardCard to="/pets" icon="paw" label="My Pets" />
        <DashboardCard to="/study" icon="book" label="Study" />
        <DashboardCard to="/shop" icon="store" label="Shop" />
        <DashboardCard to="/games" icon="gamepad" label="Games" />
        <DashboardCard to="/habits" icon="list-check" label="Habits" />
      </div>
    </div>
  );
}
