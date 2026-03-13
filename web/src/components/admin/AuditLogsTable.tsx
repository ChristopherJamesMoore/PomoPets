import { useState } from 'react'

export interface AuditLog {
  id:         string
  user_id:    string
  action:     string
  metadata:   Record<string, unknown> | null
  created_at: string
  profiles:   { display_name: string | null; email: string | null } | null
}

interface AuditLogsTableProps {
  logs:      AuditLog[]
  onRefresh: () => void
}

const ALL_ACTIONS = [
  'all',
  'user.login',
  'user.logout',
  'profile.setup',
  'profile.updated',
  'avatar.uploaded',
  'study.session_started',
  'study.session_finished',
  'coins.earned',
  'coins.penalty',
]

function formatTs(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function actionBadgeClass(action: string) {
  if (action.startsWith('user.'))    return 'audit-badge--user'
  if (action.startsWith('coins.'))   return 'audit-badge--coins'
  if (action.startsWith('study.'))   return 'audit-badge--study'
  if (action.startsWith('profile.')) return 'audit-badge--profile'
  return ''
}

export default function AuditLogsTable({ logs, onRefresh }: AuditLogsTableProps) {
  const [search,       setSearch]       = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [expanded,     setExpanded]     = useState<string | null>(null)

  const filtered = logs.filter(l => {
    const matchSearch = !search || (() => {
      const q = search.toLowerCase()
      return (
        (l.profiles?.display_name ?? '').toLowerCase().includes(q) ||
        (l.profiles?.email ?? '').toLowerCase().includes(q) ||
        l.user_id.toLowerCase().includes(q)
      )
    })()
    const matchAction = actionFilter === 'all' || l.action === actionFilter
    return matchSearch && matchAction
  })

  return (
    <div className="admin-section">
      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
        <input
          className="admin-search"
          type="text"
          placeholder="Search by user name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="admin-action-select"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
        >
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{a === 'all' ? 'All actions' : a}</option>
          ))}
        </select>
        <button className="admin-refresh-btn" onClick={onRefresh} style={{ marginLeft: 'auto' }}>
          ↻ Refresh
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="admin-empty">No log entries found.</td></tr>
            )}
            {filtered.map(l => (
              <>
                <tr key={l.id} className="admin-table-row">
                  <td className="admin-muted" style={{ whiteSpace: 'nowrap' }}>{formatTs(l.created_at)}</td>
                  <td>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.profiles?.display_name ?? <em className="admin-muted">Unknown</em>}</div>
                      <div className="admin-muted" style={{ fontSize: 11 }}>{l.profiles?.email ?? l.user_id.slice(0, 8) + '…'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`audit-badge ${actionBadgeClass(l.action)}`}>{l.action}</span>
                  </td>
                  <td>
                    {l.metadata && Object.keys(l.metadata).length > 0
                      ? (
                        <button
                          className="admin-copy-btn"
                          onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                        >
                          {expanded === l.id ? 'Hide' : 'Show'}
                        </button>
                      )
                      : <span className="admin-muted">—</span>
                    }
                  </td>
                </tr>
                {expanded === l.id && (
                  <tr key={`${l.id}-detail`} className="audit-detail-row">
                    <td colSpan={4}>
                      <pre className="audit-metadata">{JSON.stringify(l.metadata, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="admin-count">{filtered.length} of {logs.length} entries</p>
    </div>
  )
}
