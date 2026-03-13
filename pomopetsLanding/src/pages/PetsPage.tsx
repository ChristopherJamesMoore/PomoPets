import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { UserPet, PetRarity, PetAbility } from '../types/pets'
import './PetsPage.css'

// ── Constants ─────────────────────────────────────────────────────────────────
const RARITY_COLORS: Record<PetRarity, string> = {
  common:    '#888888',
  uncommon:  '#2a9d2a',
  rare:      '#2266cc',
  legendary: '#d4a017',
  prismatic: '#c839c8',
  limited:   '#7b3fa0',
}

const RARITY_LABELS: Record<PetRarity, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
  legendary: 'Legendary', prismatic: 'Prismatic', limited: 'Limited',
}

const RARITY_ORDER: PetRarity[] = ['prismatic', 'limited', 'legendary', 'rare', 'uncommon', 'common']

type SortOption = 'rarity' | 'level' | 'acquired' | 'name'
type FilterRarity = PetRarity | 'all'

interface PetWithAbilities extends UserPet {
  catalog_pet: { name: string; species: string; description: string | null }
  abilities: PetAbility[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatBar({ label, value, color }: { label: string; value: number; color?: string }) {
  const pct   = Math.max(0, Math.min(100, value))
  const fill  = color ?? (pct > 60 ? '#5a9e5a' : pct > 30 ? '#c08a30' : '#c05050')
  return (
    <div className="pets-stat-row">
      <span className="pets-stat-label">{label}</span>
      <div className="pets-stat-track">
        <div className="pets-stat-fill" style={{ width: `${pct}%`, background: fill }} />
      </div>
      <span className="pets-stat-val">{pct}</span>
    </div>
  )
}

function XpBar({ xp, level }: { xp: number; level: number }) {
  const xpNeeded = level * 100
  const pct      = Math.min(100, Math.round((xp / xpNeeded) * 100))
  return (
    <div className="pets-xp-row">
      <span className="pets-xp-label">XP</span>
      <div className="pets-xp-track">
        <div className="pets-xp-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="pets-xp-val">{xp}/{xpNeeded}</span>
    </div>
  )
}

// ── Pet detail panel ──────────────────────────────────────────────────────────
interface DetailPanelProps {
  pet:       PetWithAbilities
  isActive:  boolean
  onClose:   () => void
  onSelect:  (petId: string) => Promise<void>
  onNickname:(petId: string, name: string) => Promise<void>
  onRefresh: () => void
}

function DetailPanel({ pet, isActive, onClose, onSelect, onNickname, onRefresh }: DetailPanelProps) {
  const [nickInput,  setNickInput]  = useState(pet.nickname ?? '')
  const [nickSaving, setNickSaving] = useState(false)
  const [nickMsg,    setNickMsg]    = useState('')
  const [selecting,  setSelecting]  = useState(false)

  const color = RARITY_COLORS[pet.rarity]

  const handleNicknameSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNickSaving(true)
    setNickMsg('')
    await onNickname(pet.id, nickInput.trim())
    setNickMsg('Saved!')
    setNickSaving(false)
    setTimeout(() => setNickMsg(''), 2000)
  }

  const handleSelect = async () => {
    setSelecting(true)
    await onSelect(pet.id)
    setSelecting(false)
    onRefresh()
  }

  const displayName = pet.nickname || pet.catalog_pet.name

  return (
    <>
      <div className="pets-overlay" onClick={onClose} />
      <div className="pets-panel" style={{ '--rarity-color': color } as React.CSSProperties}>

        {/* Header */}
        <div className="pets-panel-header">
          <div className="pets-panel-sprite-wrap">
            {pet.asset_key
              ? <img src={pet.asset_key} alt={displayName} className="pets-panel-sprite" />
              : <span className="pets-panel-sprite-placeholder">🐾</span>
            }
            <div className="pets-panel-rarity-glow" />
          </div>
          <div className="pets-panel-title-col">
            <div className="pets-panel-name">{displayName}</div>
            <div className="pets-panel-species">{pet.catalog_pet.species}</div>
            <span
              className="pets-panel-rarity-badge"
              style={{ background: `${color}22`, color }}
            >
              {RARITY_LABELS[pet.rarity]}
            </span>
          </div>
          <button className="pets-panel-close" onClick={onClose}>✕</button>
        </div>

        {/* Level + XP */}
        <div className="pets-panel-level-row">
          <span className="pets-panel-level">Lv. {pet.level}</span>
          <XpBar xp={pet.xp} level={pet.level} />
        </div>

        {/* Stats */}
        <div className="pets-panel-section">
          <h3 className="pets-panel-section-title">Stats</h3>
          <StatBar label="Hunger" value={pet.hunger} />
          <StatBar label="Health" value={pet.health} />
          <StatBar label="Energy" value={pet.energy} />
        </div>

        {/* Description */}
        {pet.catalog_pet.description && (
          <div className="pets-panel-section">
            <h3 className="pets-panel-section-title">About</h3>
            <p className="pets-panel-desc">{pet.catalog_pet.description}</p>
          </div>
        )}

        {/* Abilities */}
        <div className="pets-panel-section">
          <h3 className="pets-panel-section-title">
            Abilities
            {pet.abilities.length === 0 && (
              <span className="pets-panel-section-hint"> — unlocked by levelling up</span>
            )}
          </h3>
          {pet.abilities.length === 0 ? (
            <p className="pets-panel-empty">No abilities unlocked yet.</p>
          ) : (
            <div className="pets-abilities-list">
              {pet.abilities.map(a => (
                <div key={a.id} className="pets-ability-chip">
                  <span className="pets-ability-name">{a.name}</span>
                  <span className="pets-ability-meta">Lv {a.unlock_level}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nickname */}
        <div className="pets-panel-section">
          <h3 className="pets-panel-section-title">Nickname</h3>
          <form className="pets-nick-form" onSubmit={handleNicknameSave}>
            <input
              className="pets-nick-input"
              type="text"
              placeholder={pet.catalog_pet.name}
              value={nickInput}
              onChange={e => setNickInput(e.target.value)}
              maxLength={30}
            />
            <button type="submit" className="pets-nick-btn" disabled={nickSaving}>
              {nickSaving ? '…' : 'Save'}
            </button>
          </form>
          {nickMsg && <p className="pets-nick-msg">{nickMsg}</p>}
        </div>

        {/* Set active */}
        <div className="pets-panel-actions">
          {isActive ? (
            <div className="pets-active-badge">✓ Active Pet</div>
          ) : (
            <button className="pets-set-active-btn" onClick={handleSelect} disabled={selecting}>
              {selecting ? 'Setting…' : 'Set as Active Pet'}
            </button>
          )}
        </div>

        {/* Acquired date */}
        <p className="pets-panel-acquired">
          Acquired {new Date(pet.acquired_at).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
    </>
  )
}

// ── Pet card (grid) ───────────────────────────────────────────────────────────
interface PetCardProps {
  pet:      PetWithAbilities
  isActive: boolean
  onClick:  () => void
}

function PetCard({ pet, isActive, onClick }: PetCardProps) {
  const color       = RARITY_COLORS[pet.rarity]
  const displayName = pet.nickname || pet.catalog_pet.name

  return (
    <button
      className={`pets-card ${isActive ? 'pets-card--active' : ''}`}
      style={{ '--rarity-color': color } as React.CSSProperties}
      onClick={onClick}
    >
      {isActive && <div className="pets-card-active-dot" />}

      <div className="pets-card-sprite-wrap">
        {pet.asset_key
          ? <img src={pet.asset_key} alt={displayName} className="pets-card-sprite" />
          : <span className="pets-card-placeholder">🐾</span>
        }
      </div>

      <div className="pets-card-name">{displayName}</div>
      <div className="pets-card-species">{pet.catalog_pet.species}</div>

      <span
        className="pets-card-rarity"
        style={{ background: `${color}1a`, color }}
      >
        {RARITY_LABELS[pet.rarity]}
      </span>

      <div className="pets-card-level">Lv. {pet.level}</div>

      <div className="pets-card-stats">
        <div className="pets-card-stat-row">
          <div className="pets-card-stat-fill" style={{ width: `${pet.hunger}%`, background: '#e08060' }} />
        </div>
        <div className="pets-card-stat-row">
          <div className="pets-card-stat-fill" style={{ width: `${pet.health}%`, background: '#60a060' }} />
        </div>
        <div className="pets-card-stat-row">
          <div className="pets-card-stat-fill" style={{ width: `${pet.energy}%`, background: '#6080d0' }} />
        </div>
      </div>
    </button>
  )
}

// ── PetsPage ──────────────────────────────────────────────────────────────────
export default function PetsPage() {
  const { user }                  = useAuth()
  const [pets,       setPets]     = useState<PetWithAbilities[]>([])
  const [activePetId, setActivePetId] = useState<string | null>(null)
  const [selected,   setSelected] = useState<PetWithAbilities | null>(null)
  const [loading,    setLoading]  = useState(true)

  const [sort,         setSort]         = useState<SortOption>('rarity')
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [search,       setSearch]       = useState('')

  const fetchPets = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)

    const [{ data: petData }, { data: abilityData }, { data: caData }] = await Promise.all([
      supabase
        .from('user_pets')
        .select('*, catalog_pet:catalog_pet_id(name, species, description)')
        .eq('user_id', user.id)
        .order('acquired_at', { ascending: false }),
      supabase.from('pet_abilities').select('*').eq('is_active', true),
      supabase.from('user_pet_abilities').select('user_pet_id, ability_id'),
    ])

    const allAbilities   = (abilityData as PetAbility[]) ?? []
    const abilityMap     = Object.fromEntries(allAbilities.map(a => [a.id, a]))
    const petAbilityMap: Record<string, string[]> = {}
    for (const row of (caData as { user_pet_id: string; ability_id: string }[]) ?? []) {
      if (!petAbilityMap[row.user_pet_id]) petAbilityMap[row.user_pet_id] = []
      petAbilityMap[row.user_pet_id].push(row.ability_id)
    }

    const withAbilities: PetWithAbilities[] = ((petData as UserPet[]) ?? []).map(p => ({
      ...p,
      catalog_pet: (p.catalog_pet as unknown as { name: string; species: string; description: string | null }) ?? { name: 'Unknown', species: '', description: null },
      abilities: (petAbilityMap[p.id] ?? []).map(id => abilityMap[id]).filter(Boolean),
    }))

    const active = withAbilities.find(p => p.is_selected)
    setActivePetId(active?.id ?? null)
    setPets(withAbilities)
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchPets() }, [fetchPets])

  const handleSelect = async (petId: string) => {
    // Unset current, set new
    await supabase.from('user_pets').update({ is_selected: false }).eq('user_id', user!.id)
    await supabase.from('user_pets').update({ is_selected: true }).eq('id', petId)
    setActivePetId(petId)
    setPets(prev => prev.map(p => ({ ...p, is_selected: p.id === petId })))
  }

  const handleNickname = async (petId: string, nickname: string) => {
    await supabase.from('user_pets')
      .update({ nickname: nickname || null })
      .eq('id', petId)
    setPets(prev => prev.map(p => p.id === petId ? { ...p, nickname: nickname || null } : p))
    if (selected?.id === petId) setSelected(prev => prev ? { ...prev, nickname: nickname || null } : null)
  }

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = pets
    .filter(p => {
      if (filterRarity !== 'all' && p.rarity !== filterRarity) return false
      if (search) {
        const q = search.toLowerCase()
        const name = (p.nickname || p.catalog_pet.name).toLowerCase()
        if (!name.includes(q) && !p.catalog_pet.species.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'rarity') {
        return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
      }
      if (sort === 'level') return b.level - a.level
      if (sort === 'name')  return (a.nickname || a.catalog_pet.name).localeCompare(b.nickname || b.catalog_pet.name)
      // acquired — default (newest first)
      return new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime()
    })

  const rarityGroups: PetRarity[] = [...new Set(pets.map(p => p.rarity))]
    .sort((a, b) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b))

  return (
    <div className="pets-page">
      <div className="pets-header">
        <div>
          <h1 className="pets-title">My Collection</h1>
          <p className="pets-subtitle">{pets.length} pet{pets.length !== 1 ? 's' : ''} collected</p>
        </div>
        <Link to="/shop" className="pets-shop-link">+ Get Eggs</Link>
      </div>

      {/* Toolbar */}
      <div className="pets-toolbar">
        <input
          className="pets-search"
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Rarity filter pills */}
        <div className="pets-filter-pills">
          <button
            className={`pets-filter-pill ${filterRarity === 'all' ? 'pets-filter-pill--active' : ''}`}
            onClick={() => setFilterRarity('all')}
          >
            All
          </button>
          {rarityGroups.map(r => (
            <button
              key={r}
              className={`pets-filter-pill ${filterRarity === r ? 'pets-filter-pill--active' : ''}`}
              style={filterRarity === r ? { background: RARITY_COLORS[r], color: '#fff', borderColor: RARITY_COLORS[r] } : { color: RARITY_COLORS[r], borderColor: `${RARITY_COLORS[r]}55` }}
              onClick={() => setFilterRarity(r)}
            >
              {RARITY_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="pets-sort-select"
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
        >
          <option value="rarity">Sort: Rarity</option>
          <option value="level">Sort: Level</option>
          <option value="acquired">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {loading ? (
        <div className="pets-loading">
          <span>🐾</span>
        </div>
      ) : pets.length === 0 ? (
        <div className="pets-empty">
          <span className="pets-empty-icon">🥚</span>
          <p>Your collection is empty!</p>
          <p className="pets-empty-sub">Buy an egg from the shop and hatch it to get your first pet.</p>
          <Link to="/shop" className="pets-empty-btn">Go to Shop →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pets-empty">
          <p>No pets match your filters.</p>
          <button className="pets-empty-btn" onClick={() => { setFilterRarity('all'); setSearch('') }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="pets-grid">
          {filtered.map(pet => (
            <PetCard
              key={pet.id}
              pet={pet}
              isActive={pet.id === activePetId}
              onClick={() => setSelected(pet)}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailPanel
          pet={selected}
          isActive={selected.id === activePetId}
          onClose={() => setSelected(null)}
          onSelect={handleSelect}
          onNickname={handleNickname}
          onRefresh={fetchPets}
        />
      )}
    </div>
  )
}
