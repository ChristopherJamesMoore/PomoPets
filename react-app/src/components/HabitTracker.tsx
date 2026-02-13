import { useMemo } from 'react';
import { type HabitLog } from '../types';
import './HabitTracker.css';

interface HabitTrackerProps {
  logs: HabitLog[];
}

function getLocalDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function formatTooltip(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface DayCell {
  dateStr: string;
  date: Date;
  completed: boolean;
  isFuture: boolean;
}

export default function HabitTracker({ logs }: HabitTrackerProps) {
  const weeks = useMemo(() => {
    const completedDates = new Set(logs.map(l => l.completed_date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateStr(today);

    // Start 90 days ago, align to Monday
    const start = new Date(today);
    start.setDate(today.getDate() - 90);
    const dow = start.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    start.setDate(start.getDate() + mondayOffset);

    const result: DayCell[][] = [];
    const cursor = new Date(start);

    while (getLocalDateStr(cursor) <= todayStr || result.length < 13) {
      const week: DayCell[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = getLocalDateStr(cursor);
        week.push({
          dateStr,
          date: new Date(cursor),
          completed: completedDates.has(dateStr),
          isFuture: dateStr > todayStr,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }

    return result;
  }, [logs]);

  return (
    <div className="habit-tracker">
      <div className="tracker-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="tracker-week">
            {week.map((day, di) => (
              <div
                key={di}
                className={`tracker-cell ${
                  day.isFuture
                    ? 'future'
                    : day.completed
                      ? 'completed'
                      : 'missed'
                }`}
                title={day.isFuture ? '' : formatTooltip(day.date)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
