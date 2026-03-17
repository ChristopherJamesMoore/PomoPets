import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface SupportTicket {
  id:            string
  email:         string
  category:      'query' | 'issue' | 'recommendation'
  subject:       string
  message:       string
  status:        'open' | 'in_progress' | 'resolved' | 'closed'
  admin_response: string | null
  created_at:    string
  updated_at:    string
}

interface TicketsTableProps {
  tickets:   SupportTicket[]
  onRefresh: () => void
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const
const CATEGORY_OPTIONS = ['all', 'query', 'issue', 'recommendation'] as const
const STATUS_FILTER_OPTIONS = ['all', ...STATUS_OPTIONS] as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const categoryIcons: Record<SupportTicket['category'], string> = {
  query: '💬',
  issue: '🐛',
  recommendation: '💡',
}

const statusColors: Record<SupportTicket['status'], string> = {
  open: '#e08700',
  in_progress: '#2563eb',
  resolved: '#16a34a',
  closed: '#888',
}

export default function TicketsTable({ tickets, onRefresh }: TicketsTableProps) {
  const [search, setSearch]             = useState('')
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORY_OPTIONS[number]>('all')
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTER_OPTIONS[number]>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [response, setResponse]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [updating, setUpdating]         = useState<string | null>(null)

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
    const matchStatus   = statusFilter === 'all'   || t.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

  const updateStatus = async (id: string, status: SupportTicket['status']) => {
    setUpdating(id)
    await supabase.from('support_tickets').update({ status }).eq('id', id)
    onRefresh()
    setUpdating(null)
  }

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setResponse(ticket.admin_response ?? '')
  }

  const saveResponse = async () => {
    if (!selectedTicket) return
    setSaving(true)
    await supabase.from('support_tickets').update({
      admin_response: response.trim() || null,
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
    }).eq('id', selectedTicket.id)
    setSaving(false)
    setSelectedTicket(null)
    onRefresh()
  }

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search email or subject…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-filter-tabs">
          {CATEGORY_OPTIONS.map(c => (
            <button
              key={c}
              className={`admin-tab ${categoryFilter === c ? 'admin-tab--active' : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div className="admin-filter-tabs">
          {STATUS_FILTER_OPTIONS.map(s => (
            <button
              key={s}
              className={`admin-tab ${statusFilter === s ? 'admin-tab--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Subject</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">No tickets found.</td></tr>
            )}
            {filtered.map(t => (
              <tr key={t.id} className={t.admin_response ? '' : 'ticket-unread'}>
                <td>
                  <span className="ticket-category-badge" data-category={t.category}>
                    {categoryIcons[t.category]} {t.category}
                  </span>
                </td>
                <td className="ticket-subject" onClick={() => openTicket(t)}>{t.subject}</td>
                <td className="admin-email">{t.email}</td>
                <td className="admin-muted">{formatDate(t.created_at)}</td>
                <td>
                  <select
                    className="admin-status-select"
                    value={t.status}
                    disabled={updating === t.id}
                    onChange={ev => updateStatus(t.id, ev.target.value as SupportTicket['status'])}
                    style={{ color: statusColors[t.status] }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="ticket-view-btn" onClick={() => openTicket(t)}>
                    {t.admin_response ? 'View' : 'Respond'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="admin-count">{filtered.length} of {tickets.length} tickets</p>

      {/* ── Ticket detail / response panel ── */}
      {selectedTicket && (
        <div className="ticket-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-panel" onClick={e => e.stopPropagation()}>
            <div className="ticket-panel-header">
              <h3 className="ticket-panel-title">{selectedTicket.subject}</h3>
              <button className="ticket-panel-close" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className="ticket-panel-meta">
              <span className="ticket-category-badge" data-category={selectedTicket.category}>
                {categoryIcons[selectedTicket.category]} {selectedTicket.category}
              </span>
              <span className="ticket-meta-item">{selectedTicket.email}</span>
              <span className="ticket-meta-item">{formatDate(selectedTicket.created_at)}</span>
            </div>

            <div className="ticket-panel-message">
              <label className="ticket-panel-label">Message</label>
              <p className="ticket-panel-text">{selectedTicket.message}</p>
            </div>

            <div className="ticket-panel-response">
              <label className="ticket-panel-label">Admin Response</label>
              <textarea
                className="ticket-response-textarea"
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Write your response…"
                rows={5}
              />
            </div>

            <div className="ticket-panel-actions">
              <button
                className="ticket-save-btn"
                onClick={saveResponse}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Response'}
              </button>
              <button
                className="ticket-cancel-btn"
                onClick={() => setSelectedTicket(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
