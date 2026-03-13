import { useState } from 'react'

export interface AdminUser {
  id:           string
  display_name: string
  email:        string | null
  avatar_url:   string | null
  coins:        number
  created_at:   string
}

interface UsersTableProps {
  users:          AdminUser[]
  selectedId:     string | null
  onSelectUser:   (u: AdminUser) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function UsersTable({ users, selectedId, onSelectUser }: UsersTableProps) {
  const [search, setSearch] = useState('')

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="admin-toolbar-note">{filtered.length} of {users.length} users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Coins</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="admin-empty">No users found.</td></tr>
            )}
            {filtered.map(u => (
              <tr
                key={u.id}
                className={`admin-table-row ${selectedId === u.id ? 'admin-row--selected' : ''}`}
                onClick={() => onSelectUser(u)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-avatar">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" />
                        : <span>{(u.display_name?.[0] ?? '?').toUpperCase()}</span>
                      }
                    </div>
                    <span className="admin-user-name">{u.display_name || <em className="admin-muted">No name</em>}</span>
                  </div>
                </td>
                <td className="admin-email">{u.email ?? <span className="admin-muted">—</span>}</td>
                <td>🪙 {u.coins.toLocaleString()}</td>
                <td className="admin-muted">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
