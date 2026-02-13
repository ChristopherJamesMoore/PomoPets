export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  display_name_changed_at: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
}
