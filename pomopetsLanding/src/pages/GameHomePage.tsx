import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import './GameHomePage.css'

interface ActivePet {
  id: string
  nickname: string | null
  level: number
  hunger: number
  happiness: number
  energy: number
  catalog_pet: {
    name: string
    species: string
    asset_key: string
  }
}

const TILES = [
  { to: '/shop',     emoji: '🛒', label: 'Buy',     sub: 'Pets & items'   },
  { to: '/health',   emoji: '🩺', label: 'Health',  sub: 'Log your stats' },
  { to: '/habits',   emoji: '✅', label: 'Habits',  sub: 'Daily streaks'  },
  { to: '/settings', emoji: '⚙️', label: 'Profile', sub: 'Your account'   },
]

function StatBar({ label, value }: { label: string; value: number }) {
  const pct   = Math.max(0, Math.min(100, value))
  const color = pct > 60 ? '#5a9e5a' : pct > 30 ? '#c08a30' : '#c05050'
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-val">{pct}</span>
    </div>
  )
}

export default function GameHomePage() {
  const { profile } = useAuth()
  const [pet, setPet] = useState<ActivePet | null | undefined>(undefined)

  useEffect(() => {
    supabase
      .from('user_pets')
      .select('id, nickname, level, hunger, happiness, energy, catalog_pet:catalog_pet_id(name, species, asset_key)')
      .eq('is_selected', true)
      .maybeSingle()
      .then(({ data }) => setPet((data as unknown as ActivePet) ?? null))
  }, [])

  const petName = pet?.nickname ?? pet?.catalog_pet?.name ?? 'Unknown'

  return (
    <div className="game-home">

      <h1 className="game-greeting">
        Hey, {profile?.display_name || 'Trainer'}! 👋
      </h1>

      {/* Pet House */}
      <section className="pet-house">
        <div className="pet-house-label">🏠 Your House</div>

        {pet === undefined && (
          <div className="pet-house-state">
            <span className="pet-house-emoji spinning">🐾</span>
          </div>
        )}

        {pet === null && (
          <div className="pet-house-state">
            <span className="pet-house-emoji faded">🐾</span>
            <p>Your house is empty</p>
            <Link to="/shop" className="pet-house-btn">Get a Pet</Link>
          </div>
        )}

        {pet && (
          <div className="pet-house-active">
            <div className="pet-display">
              <span className="pet-house-emoji">🐾</span>
              <div>
                <div className="pet-name">{petName}</div>
                <div className="pet-meta">Lv. {pet.level} · {pet.catalog_pet.species}</div>
              </div>
            </div>
            <div className="pet-stats">
              <StatBar label="Hunger"    value={pet.hunger}    />
              <StatBar label="Happiness" value={pet.happiness} />
              <StatBar label="Energy"    value={pet.energy}    />
            </div>
            <Link to="/pets" className="pet-manage-link">Manage Pets →</Link>
          </div>
        )}
      </section>

      {/* Feature Tiles */}
      <section className="feature-grid">
        {TILES.map(({ to, emoji, label, sub }) => (
          <Link key={to} to={to} className="feature-tile">
            <span className="tile-emoji">{emoji}</span>
            <span className="tile-label">{label}</span>
            <span className="tile-sub">{sub}</span>
          </Link>
        ))}
      </section>

    </div>
  )
}
