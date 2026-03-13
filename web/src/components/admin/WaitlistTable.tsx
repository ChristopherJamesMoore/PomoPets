import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface WaitlistEntry {
  id:         string
  email:      string
  name:       string | null
  source:     'general' | 'vip'
  vip_token:  string | null
  status:     'pending' | 'notified' | 'converted'
  created_at: string
}

interface WaitlistTableProps {
  entries:   WaitlistEntry[]
  onRefresh: () => void
}

const STATUS_OPTIONS = ['pending', 'notified', 'converted'] as const
const SOURCE_OPTIONS = ['all', 'general', 'vip'] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function exportCsv(entries: WaitlistEntry[]) {
  const header = 'Name,Email,Source,Token,Status,Joined'
  const rows   = entries.map(e =>
    [e.name ?? '', e.email, e.source, e.vip_token ?? '', e.status, formatDate(e.created_at)]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `pomopets-waitlist-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function WaitlistTable({ entries, onRefresh }: WaitlistTableProps) {
  const [search,     setSearch]     = useState('')
  const [sourceFilter, setSourceFilter] = useState<typeof SOURCE_OPTIONS[number]>('all')
  const [updating,   setUpdating]   = useState<string | null>(null)

  const filtered = entries.filter(e => {
    const matchSearch = !search ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchSource = sourceFilter === 'all' || e.source === sourceFilter
    return matchSearch && matchSource
  })

  const updateStatus = async (id: string, status: WaitlistEntry['status']) => {
    setUpdating(id)
    await supabase.from('waitlist_entries').update({ status }).eq('id', id)
    onRefresh()
    setUpdating(null)
  }

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search email or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-filter-tabs">
          {SOURCE_OPTIONS.map(s => (
            <button
              key={s}
              className={`admin-tab ${sourceFilter === s ? 'admin-tab--active' : ''}`}
              onClick={() => setSourceFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button className="admin-export-btn" onClick={() => exportCsv(filtered)}>
          ↓ Export CSV
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Source</th>
              <th>Token</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">No entries found.</td></tr>
            )}
            {filtered.map(e => (
              <tr key={e.id}>
                <td>{e.name ?? <span className="admin-muted">—</span>}</td>
                <td className="admin-email">{e.email}</td>
                <td>
                  <span className={`admin-source-badge admin-source-badge--${e.source}`}>
                    {e.source === 'vip' ? '⭐ VIP' : 'General'}
                  </span>
                </td>
                <td className="admin-muted">{e.vip_token ?? '—'}</td>
                <td className="admin-muted">{formatDate(e.created_at)}</td>
                <td>
                  <select
                    className="admin-status-select"
                    value={e.status}
                    disabled={updating === e.id}
                    onChange={ev => updateStatus(e.id, ev.target.value as WaitlistEntry['status'])}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="admin-count">{filtered.length} of {entries.length} entries</p>
    </div>
  )
}
