import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { type Habit, type HabitLog } from '../types';
import HabitCard from '../components/HabitCard';
import AddHabitForm from '../components/AddHabitForm';
import FormMessage from '../components/FormMessage';
import './HabitsPage.css';

function getLocalDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function computeStreak(logs: HabitLog[]): number {
  if (logs.length === 0) return 0;
  const dates = new Set(logs.map(l => l.completed_date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const cursor = new Date(today);

  // If today isn't completed, start counting from yesterday
  if (!dates.has(getLocalDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dates.has(getLocalDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function HabitsPage() {
  const { user, refreshProfile } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const todayStr = getLocalDateStr(new Date());

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from('habits')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true });
    if (err) {
      console.error('Fetch habits error:', err);
      setError('Failed to load habits.');
    }
    setHabits((data as Habit[]) ?? []);
  }, [user]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    const start = new Date();
    start.setDate(start.getDate() - 91);
    const { data, error: err } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', getLocalDateStr(start));
    if (err) {
      console.error('Fetch logs error:', err);
    }
    setLogs((data as HabitLog[]) ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchHabits(), fetchLogs()]).finally(() => setLoading(false));
  }, [user, fetchHabits, fetchLogs]);

  const toggleHabit = async (habitId: string) => {
    if (!user) return;
    const isCompleted = logs.some(
      l => l.habit_id === habitId && l.completed_date === todayStr,
    );

    if (isCompleted) {
      await supabase
        .from('habit_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('habit_id', habitId)
        .eq('completed_date', todayStr);
    } else {
      await supabase.from('habit_logs').upsert(
        { user_id: user.id, habit_id: habitId, completed_date: todayStr },
        { onConflict: 'user_id,habit_id,completed_date', ignoreDuplicates: true },
      );
    }

    await fetchLogs();
    await refreshProfile();
  };

  const addHabit = async (name: string, icon: string) => {
    if (!user) return;
    const { error: err } = await supabase.from('habits').insert({
      user_id: user.id,
      name,
      icon,
      is_default: false,
      sort_order: habits.length + 1,
    });
    if (err) {
      console.error('Add habit error:', err);
      throw new Error(err.message);
    }
    await fetchHabits();
    setShowAddForm(false);
  };

  const deleteHabit = async (habitId: string) => {
    await supabase.from('habits').delete().eq('id', habitId);
    await Promise.all([fetchHabits(), fetchLogs()]);
  };

  const defaultHabits = habits.filter(h => h.is_default);
  const customHabits = habits.filter(h => !h.is_default);

  const logsForHabit = (habitId: string) =>
    logs.filter(l => l.habit_id === habitId);

  const isTodayCompleted = (habitId: string) =>
    logs.some(l => l.habit_id === habitId && l.completed_date === todayStr);

  if (loading) {
    return (
      <div className="habits-page">
        <p>Loading habits...</p>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <div className="habits-header">
        <h1>My Habits</h1>
        <p className="habits-subtitle">Track your daily routines and earn coins</p>
        {!showAddForm && (
          <button className="btn-add-habit" onClick={() => setShowAddForm(true)}>
            + New Habit
          </button>
        )}
      </div>

      <FormMessage type="error" message={error} />

      {showAddForm && (
        <AddHabitForm onAdd={addHabit} onCancel={() => setShowAddForm(false)} />
      )}

      {defaultHabits.length > 0 && (
        <section className="habits-section">
          <h2>Daily Habits</h2>
          <div className="habits-list">
            {defaultHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logs={logsForHabit(habit.id)}
                todayCompleted={isTodayCompleted(habit.id)}
                streak={computeStreak(logsForHabit(habit.id))}
                onToggleToday={() => toggleHabit(habit.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="habits-section">
        <h2>My Custom Habits</h2>
        {customHabits.length === 0 ? (
          <p className="habits-empty">
            No custom habits yet. Click "+ New Habit" to create one.
          </p>
        ) : (
          <div className="habits-list">
            {customHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                logs={logsForHabit(habit.id)}
                todayCompleted={isTodayCompleted(habit.id)}
                streak={computeStreak(logsForHabit(habit.id))}
                onToggleToday={() => toggleHabit(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
