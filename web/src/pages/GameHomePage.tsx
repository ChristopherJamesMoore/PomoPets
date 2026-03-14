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
  health: number
  energy: number
  rarity: string
  asset_key: string | null
  catalog_pet: { name: string; species: string }
}

const RARITY_COLORS: Record<string, string> = {
  common: '#888888', uncommon: '#2a9d2a', rare: '#2266cc',
  legendary: '#d4a017', prismatic: '#c839c8', limited: '#7b3fa0',
}

const TILES = [
  { to: '/pomodoro', emoji: '⏱️', label: 'Study',      sub: 'Pomodoro timer'   },
  { to: '/shop',     emoji: '🏪', label: 'Shop',       sub: 'Buy eggs'         },
  { to: '/hatchery', emoji: '🥚', label: 'Hatchery',   sub: 'Watch eggs hatch' },
  { to: '/pets',     emoji: '🐾', label: 'Collection', sub: 'Your pets'        },
  { to: '/health',   emoji: '🩺', label: 'Health',     sub: 'Log your stats'   },
  { to: '/habits',   emoji: '✅', label: 'Habits',     sub: 'Daily streaks'    },
  { to: '/settings', emoji: '⚙️', label: 'Settings',  sub: 'Profile & themes' },
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
      .select('id, nickname, level, hunger, health, energy, rarity, asset_key, catalog_pet:catalog_pet_id(name, species)')
      .eq('is_selected', true)
      .maybeSingle()
      .then(({ data }) => setPet((data as unknown as ActivePet) ?? null))
  }, [])

  const petName    = pet?.nickname ?? pet?.catalog_pet?.name ?? 'Unknown'
  const rarityColor = pet ? (RARITY_COLORS[pet.rarity] ?? '#888') : undefined

  return (
    <div className="game-home">

      <h1 className="game-greeting">
        Hey, {profile?.display_name || 'Trainer'}! 👋
      </h1>

      <div className="game-home-body">

        {/* ── Left: Pet House ── */}
        <section className="pet-house">
          <div className="pet-house-label">🏠 Your House</div>

          {pet === undefined && (
            <div className="pet-house-state">
              <span className="pet-house-emoji spinning">🐾</span>
            </div>
          )}

          {pet === null && (
            <div className="pet-house-empty">
              <div className="pet-house-empty-visual">🥚</div>
              <h3 className="pet-house-empty-title">No pet yet</h3>
              <p className="pet-house-empty-text">
                Head to the shop to buy your first egg and start your journey!
              </p>
              <Link to="/shop" className="pet-house-btn">Visit Shop →</Link>
            </div>
          )}

          {pet && (
            <div className="pet-house-active">
              <div className="pet-display">
                <div
                  className="pet-sprite-frame"
                  style={{ background: `${rarityColor}18`, borderColor: `${rarityColor}40` }}
                >
                  {pet.asset_key
                    ? <img src={pet.asset_key} alt={petName} className="pet-sprite" />
                    : <span className="pet-house-emoji">🐾</span>
                  }
                </div>
                <div className="pet-info">
                  <div className="pet-name">{petName}</div>
                  <div className="pet-meta">
                    {pet.catalog_pet.species} · Lv. {pet.level}
                  </div>
                  <span
                    className="pet-rarity-tag"
                    style={{ background: `${rarityColor}18`, color: rarityColor }}
                  >
                    {pet.rarity}
                  </span>
                </div>
              </div>

              <div className="pet-stats">
                <StatBar label="Hunger" value={pet.hunger} />
                <StatBar label="Health" value={pet.health} />
                <StatBar label="Energy" value={pet.energy} />
              </div>

              <Link to="/pets" className="pet-manage-link">Manage Pets →</Link>
            </div>
          )}
        </section>

        {/* ── Right: Navigation Tiles ── */}
        <nav className="nav-tiles">
          {TILES.map(({ to, emoji, label, sub }) => (
            <Link key={to} to={to} className="nav-tile">
              <span className="nav-tile-icon">{emoji}</span>
              <span className="nav-tile-text">
                <span className="nav-tile-label">{label}</span>
                <span className="nav-tile-sub">{sub}</span>
              </span>
              <span className="nav-tile-arrow">›</span>
            </Link>
          ))}
        </nav>

      </div>
    </div>
  )
}
