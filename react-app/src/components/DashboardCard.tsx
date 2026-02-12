import { Link } from 'react-router-dom';
import Icon from './Icon';

interface DashboardCardProps {
  to: string;
  icon: string;
  label: string;
}

export default function DashboardCard({ to, icon, label }: DashboardCardProps) {
  return (
    <Link to={to} className="dashboard-card">
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
