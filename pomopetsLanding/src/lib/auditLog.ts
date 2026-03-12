import { supabase } from './supabase'

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'profile.setup'
  | 'profile.updated'
  | 'avatar.uploaded'
  | 'study.session_started'
  | 'study.session_finished'
  | 'coins.earned'
  | 'coins.penalty'

export function logEvent(
  userId: string,
  action: AuditAction,
  metadata?: Record<string, unknown>,
) {
  // Fire-and-forget — never blocks the UI
  supabase.from('audit_logs').insert({ user_id: userId, action, metadata }).then()
}
