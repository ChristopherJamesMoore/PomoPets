interface StatsProps {
  total:   number
  general: number
  vip:     number
  tokens:  number
  users:   number
}

export default function AdminStats({ total, general, vip, tokens, users }: StatsProps) {
  const stats = [
    { label: 'Total Users',      value: users   },
    { label: 'Waitlist Total',   value: total   },
    { label: 'General',          value: general },
    { label: 'VIP',              value: vip     },
    { label: 'Active Tokens',    value: tokens  },
  ]

  return (
    <div className="admin-stats">
      {stats.map(s => (
        <div key={s.label} className="admin-stat-card">
          <div className="admin-stat-value">{s.value}</div>
          <div className="admin-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
