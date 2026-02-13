export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  display_name_changed_at: string | null;
  coins: number;
  created_at: string;
  updated_at: string;
}
