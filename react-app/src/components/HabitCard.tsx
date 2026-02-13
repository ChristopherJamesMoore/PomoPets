import { type Habit, type HabitLog } from '../types';
import GlassCard from './GlassCard';
import HabitTracker from './HabitTracker';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  todayCompleted: boolean;
  streak: number;
  onToggleToday: () => void;
  onDelete?: () => void;
}

export default function HabitCard({
  habit,
  logs,
  todayCompleted,
  streak,
  onToggleToday,
  onDelete,
}: HabitCardProps) {
  return (
    <GlassCard className="habit-card">
      <div className="habit-card-header">
        <i className={`fas fa-${habit.icon}`} />
        <span className="habit-name">{habit.name}</span>

        {streak >= 3 && (
          <span className="habit-streak">
            <i className="fas fa-fire" /> {streak}d
          </span>
        )}

        <button
          className={`habit-check-btn ${todayCompleted ? 'completed' : ''}`}
          onClick={onToggleToday}
          aria-label={todayCompleted ? 'Uncheck habit' : 'Check habit'}
        >
          <i className={`fas fa-${todayCompleted ? 'check' : 'circle'}`} />
        </button>

        {onDelete && (
          <button
            className="habit-delete-btn"
            onClick={onDelete}
            aria-label="Delete habit"
          >
            <i className="fas fa-trash" />
          </button>
        )}
      </div>

      <HabitTracker logs={logs} />
    </GlassCard>
  );
}
