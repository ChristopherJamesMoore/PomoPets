import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { PetCatalogItem, PetVariant, PetRarity } from '../types/pets'
import './ShopPage.css'

// ── Constants ─────────────────────────────────────────────────────────────────
const RARITY_COLORS: Record<PetRarity, string> = {
  common:    '#888',
  uncommon:  '#2a9d2a',
  rare:      '#2266cc',
  legendary: '#d4a017',
  prismatic: '#c839c8',
  limited:   '#7b3fa0',
}

interface PetWithVariants extends PetCatalogItem {
  variants: PetVariant[]
}

// ── Rarity odds mini-chart ────────────────────────────────────────────────────
function RarityOdds({ variants }: { variants: PetVariant[] }) {
  const eligible    = variants.filter(v => v.drop_weight > 0)
  const totalWeight = eligible.reduce((s, v) => s + v.drop_weight, 0)
  if (!totalWeight) return null

  return (
    <div className="shop-odds">
      {eligible.map(v => {
        const pct = Math.round((v.drop_weight / totalWeight) * 100)
        return (
          <div key={v.rarity} className="shop-odds-row">
            <span className="shop-odds-dot" style={{ background: RARITY_COLORS[v.rarity] }} />
            <span className="shop-odds-name" style={{ color: RARITY_COLORS[v.rarity] }}>
              {v.rarity}
            </span>
            <span className="shop-odds-pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Pet egg card ──────────────────────────────────────────────────────────────
interface EggCardProps {
  pet:        PetWithVariants
  coins:      number
  slotsLeft:  number
  onBuy:      (petId: string) => Promise<void>
}

function EggCard({ pet, coins, slotsLeft, onBuy }: EggCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [buying,   setBuying]   = useState(false)
  const [msg,      setMsg]      = useState('')

  const canAfford = coins >= pet.coin_cost
  const hasSlot   = slotsLeft > 0
  const disabled  = buying || !canAfford || !hasSlot

  const handleBuy = async () => {
    setBuying(true)
    setMsg('')
    await onBuy(pet.id)
    setBuying(false)
    setMsg('Egg added to hatchery!')
    setTimeout(() => setMsg(''), 3000)
  }

  const hours = pet.hatch_hours
  const timeLabel = hours >= 24
    ? `${Math.floor(hours / 24)}d ${hours % 24 > 0 ? `${hours % 24}h` : ''}`.trim()
    : `${hours}h`

  return (
    <div className={`shop-card ${pet.availability === 'limited' ? 'shop-card--limited' : ''}`}>
      {pet.availability === 'limited' && (
        <div className="shop-limited-banner">Limited</div>
      )}

      {/* Egg image */}
      <div className="shop-egg-wrap">
        {pet.egg_asset_key
          ? <img src={pet.egg_asset_key} alt={`${pet.name} egg`} className="shop-egg-img" />
          : <span className="shop-egg-placeholder">🥚</span>
        }
      </div>

      {/* Info */}
      <div className="shop-card-name">{pet.name}</div>
      <div className="shop-card-species">{pet.species}</div>

      <div className="shop-card-stats">
        <span className="shop-stat-chip">⏳ {timeLabel} hatch</span>
      </div>

      {/* Rarity odds toggle */}
      {pet.variants.length > 0 && (
        <button className="shop-odds-toggle" onClick={() => setExpanded(x => !x)}>
          {expanded ? 'Hide odds ▲' : 'View odds ▼'}
        </button>
      )}
      {expanded && <RarityOdds variants={pet.variants} />}

      {/* Cost + Buy */}
      <div className="shop-card-footer">
        <span className="shop-cost">
          🪙 {pet.coin_cost.toLocaleString()}
        </span>
        <button
          className="shop-buy-btn"
          onClick={handleBuy}
          disabled={disabled}
          title={
            !hasSlot    ? 'No egg slots available — check your hatchery'
            : !canAfford ? `Need ${(pet.coin_cost - coins).toLocaleString()} more coins`
            : ''
          }
        >
          {buying ? '…' : 'Buy Egg'}
        </button>
      </div>

      {msg && <p className="shop-buy-msg">{msg}</p>}

      {!canAfford && !buying && (
        <p className="shop-buy-hint">
          Need {(pet.coin_cost - coins).toLocaleString()} more 🪙
        </p>
      )}
      {!hasSlot && canAfford && !buying && (
        <p className="shop-buy-hint shop-buy-hint--warn">
          No egg slots — <Link to="/hatchery">hatch an egg first</Link>
        </p>
      )}
    </div>
  )
}

// ── ShopPage ──────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const { profile, refreshProfile } = useAuth()
  const [catalog,    setCatalog]    = useState<PetWithVariants[]>([])
  const [activeEggs, setActiveEggs] = useState(0)
  const [eggSlots,   setEggSlots]   = useState(3)
  const [loading,    setLoading]    = useState(true)
  const [buyError,   setBuyError]   = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [
      { data: petData },
      { data: variantData },
      { data: eggData },
      { data: profileData },
    ] = await Promise.all([
      supabase
        .from('pet_catalog')
        .select('*')
        .eq('is_active', true)
        .neq('availability', 'retired')
        .order('sort_order', { ascending: true }),
      supabase.from('pet_catalog_variants').select('*'),
      supabase
        .from('pet_eggs')
        .select('id')
        .is('hatched_at', null),
      supabase
        .from('profiles')
        .select('egg_slots')
        .eq('id', profile?.id ?? '')
        .single(),
    ])

    const variantsByPet: Record<string, PetVariant[]> = {}
    for (const v of (variantData as PetVariant[]) ?? []) {
      if (!variantsByPet[v.catalog_pet_id]) variantsByPet[v.catalog_pet_id] = []
      variantsByPet[v.catalog_pet_id].push(v)
    }

    const withVariants: PetWithVariants[] = ((petData as PetCatalogItem[]) ?? []).map(p => ({
      ...p,
      variants: (variantsByPet[p.id] ?? []).sort((a, b) => b.drop_weight - a.drop_weight),
    }))

    setCatalog(withVariants)
    setActiveEggs((eggData ?? []).length)
    setEggSlots((profileData as { egg_slots: number } | null)?.egg_slots ?? 3)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { if (profile?.id) fetchData() }, [fetchData, profile?.id])

  const handleBuy = async (petId: string) => {
    setBuyError('')
    const { error } = await supabase.rpc('buy_egg', { p_catalog_pet_id: petId })
    if (error) {
      setBuyError(error.message)
    } else {
      await refreshProfile()
      setActiveEggs(n => n + 1)
    }
  }

  const slotsLeft = eggSlots - activeEggs
  const coins     = profile?.coins ?? 0

  return (
    <div className="shop-page">
      <div className="shop-topbar">
        <div className="shop-topbar-left">
          <h1 className="shop-title">Egg Shop</h1>
          <p className="shop-subtitle">Buy an egg, then hatch it in your hatchery!</p>
        </div>
        <div className="shop-topbar-right">
          <div className="shop-coins-badge">🪙 {coins.toLocaleString()}</div>
          <Link to="/hatchery" className="shop-hatchery-link">
            🥚 {activeEggs}/{eggSlots} eggs
          </Link>
        </div>
      </div>

      {buyError && (
        <div className="shop-error">⚠️ {buyError}</div>
      )}

      {slotsLeft === 0 && (
        <div className="shop-slots-warning">
          All egg slots are full.{' '}
          <Link to="/hatchery">Hatch an egg</Link> to free up a slot.
        </div>
      )}

      {loading ? (
        <div className="shop-loading">
          <span className="shop-loading-paw">🐾</span>
        </div>
      ) : catalog.length === 0 ? (
        <div className="shop-empty">
          <p>No eggs available right now — check back soon!</p>
        </div>
      ) : (
        <div className="shop-grid">
          {catalog.map(pet => (
            <EggCard
              key={pet.id}
              pet={pet}
              coins={coins}
              slotsLeft={slotsLeft}
              onBuy={handleBuy}
            />
          ))}
        </div>
      )}
    </div>
  )
}
