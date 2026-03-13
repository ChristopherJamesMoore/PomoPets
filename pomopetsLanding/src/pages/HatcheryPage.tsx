import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { PetRarity } from '../types/pets'
import './HatcheryPage.css'

// ── Types ─────────────────────────────────────────────────────────────────────
interface EggWithPet {
  id:             string
  catalog_pet_id: string
  hatch_at:       string
  hatched_at:     string | null
  hours_skipped:  number
  created_at:     string
  catalog_pet: {
    name:          string
    species:       string
    egg_asset_key: string | null
  }
}

interface HatchResult {
  pet_id:    string
  rarity:    PetRarity
  asset_key: string
  pet_name:  string
}

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

const RARITY_GLOWS: Record<PetRarity, string> = {
  common:    'rgba(136,136,136,0.25)',
  uncommon:  'rgba(42,157,42,0.25)',
  rare:      'rgba(34,102,204,0.25)',
  legendary: 'rgba(212,160,23,0.35)',
  prismatic: 'rgba(200,57,200,0.35)',
  limited:   'rgba(123,63,160,0.35)',
}

const SKIP_COST = 15

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready to hatch!'
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${m.toString().padStart(2, '0')}m`
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

function formatHatchTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Slot bar ──────────────────────────────────────────────────────────────────
function SlotBar({
  used, total, coins, onBuySlot,
}: { used: number; total: number; coins: number; onBuySlot: () => void }) {
  const canBuy     = total < 5 && coins >= 100
  const atMax      = total >= 5

  return (
    <div className="hatch-slots">
      <div className="hatch-slots-info">
        <span className="hatch-slots-label">Egg Slots</span>
        <div className="hatch-slots-pips">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`hatch-slot-pip ${i < used ? 'hatch-slot-pip--used' : ''}`} />
          ))}
          {Array.from({ length: 5 - total }).map((_, i) => (
            <div key={`lock-${i}`} className="hatch-slot-pip hatch-slot-pip--locked" />
          ))}
        </div>
        <span className="hatch-slots-count">{used}/{total}</span>
      </div>
      {!atMax && (
        <button
          className="hatch-buy-slot-btn"
          onClick={onBuySlot}
          disabled={!canBuy}
          title={!canBuy ? 'Need 100 🪙 to unlock a slot' : 'Unlock an extra egg slot'}
        >
          + Slot <span className="hatch-buy-slot-cost">100 🪙</span>
        </button>
      )}
      {atMax && (
        <span className="hatch-slots-maxed">Max slots reached</span>
      )}
    </div>
  )
}

// ── Hatch result card ─────────────────────────────────────────────────────────
function HatchResultCard({ result, petName }: { result: HatchResult; petName: string }) {
  const color = RARITY_COLORS[result.rarity]
  const glow  = RARITY_GLOWS[result.rarity]

  return (
    <div
      className="hatch-result-card"
      style={{
        '--rarity-color': color,
        '--rarity-glow':  glow,
      } as React.CSSProperties}
    >
      <div className="hatch-result-glow" />
      <div className="hatch-result-sprite-wrap">
        {result.asset_key
          ? <img src={result.asset_key} alt={result.pet_name} className="hatch-result-sprite" />
          : <span className="hatch-result-emoji">🐾</span>
        }
      </div>
      <span
        className="hatch-result-rarity"
        style={{ background: `${color}22`, color }}
      >
        {RARITY_LABELS[result.rarity]}
      </span>
      <div className="hatch-result-name">{result.pet_name}</div>
      <p className="hatch-result-msg">A new pet has joined your collection!</p>
      <Link to="/pets" className="hatch-result-btn">Go to Collection →</Link>
    </div>
  )
}

// ── Egg card ──────────────────────────────────────────────────────────────────
interface EggCardProps {
  egg:         EggWithPet
  now:         number
  coins:       number
  skipping:    boolean
  hatching:    boolean
  result:      HatchResult | null
  onSkip:      () => void
  onHatch:     () => void
}

function EggCard({ egg, now, coins, skipping, hatching, result, onSkip, onHatch }: EggCardProps) {
  const hatchAt  = new Date(egg.hatch_at).getTime()
  const msLeft   = hatchAt - now
  const isReady  = msLeft <= 0
  const canSkip  = !isReady && coins >= SKIP_COST

  if (result) {
    return <HatchResultCard result={result} petName={egg.catalog_pet.name} />
  }

  return (
    <div className={`hatch-card ${isReady ? 'hatch-card--ready' : ''}`}>
      {/* Egg image */}
      <div className="hatch-egg-wrap">
        {egg.catalog_pet.egg_asset_key
          ? <img src={egg.catalog_pet.egg_asset_key} alt="egg" className="hatch-egg-img" />
          : <span className="hatch-egg-placeholder">🥚</span>
        }
        {isReady && <div className="hatch-ready-glow" />}
      </div>

      <div className="hatch-card-name">{egg.catalog_pet.name}</div>
      <div className="hatch-card-species">{egg.catalog_pet.species}</div>

      {/* Countdown */}
      <div className={`hatch-countdown ${isReady ? 'hatch-countdown--ready' : ''}`}>
        {isReady ? '✨ Ready to Hatch!' : formatCountdown(msLeft)}
      </div>

      {!isReady && (
        <div className="hatch-hatches-at">
          Hatches {formatHatchTime(egg.hatch_at)}
        </div>
      )}

      {/* Progress bar */}
      {!isReady && (() => {
        const total   = new Date(egg.hatch_at).getTime() - new Date(egg.created_at).getTime()
        const elapsed = now - new Date(egg.created_at).getTime()
        const pct     = Math.min(100, Math.max(0, (elapsed / total) * 100))
        return (
          <div className="hatch-progress-track">
            <div className="hatch-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )
      })()}

      {/* Actions */}
      <div className="hatch-actions">
        {!isReady && (
          <button
            className="hatch-skip-btn"
            onClick={onSkip}
            disabled={skipping || !canSkip}
            title={!canSkip ? `Need ${SKIP_COST} 🪙 to skip an hour` : 'Remove 1 hour from hatch time'}
          >
            {skipping ? '…' : `−1h · ${SKIP_COST} 🪙`}
          </button>
        )}

        {isReady && (
          <button
            className="hatch-hatch-btn"
            onClick={onHatch}
            disabled={hatching}
          >
            {hatching ? 'Hatching…' : '🥚 Hatch!'}
          </button>
        )}
      </div>

      {egg.hours_skipped > 0 && (
        <p className="hatch-skipped-note">
          ⚡ {egg.hours_skipped}h skipped
        </p>
      )}
    </div>
  )
}

// ── HatcheryPage ──────────────────────────────────────────────────────────────
export default function HatcheryPage() {
  const { profile, refreshProfile } = useAuth()
  const [eggs,        setEggs]        = useState<EggWithPet[]>([])
  const [eggSlots,    setEggSlots]    = useState(3)
  const [results,     setResults]     = useState<Record<string, HatchResult>>({})
  const [skipping,    setSkipping]    = useState<string | null>(null)
  const [hatching,    setHatching]    = useState<string | null>(null)
  const [slotBuying,  setSlotBuying]  = useState(false)
  const [error,       setError]       = useState('')
  const [now,         setNow]         = useState(Date.now())
  const [loading,     setLoading]     = useState(true)

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchEggs = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const [{ data: eggData }, { data: profileData }] = await Promise.all([
      supabase
        .from('pet_eggs')
        .select('*, catalog_pet:catalog_pet_id(name, species, egg_asset_key)')
        .is('hatched_at', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('egg_slots')
        .eq('id', profile.id)
        .single(),
    ])
    setEggs((eggData as EggWithPet[]) ?? [])
    setEggSlots((profileData as { egg_slots: number } | null)?.egg_slots ?? 3)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { fetchEggs() }, [fetchEggs])

  const handleSkip = async (eggId: string) => {
    setError('')
    setSkipping(eggId)
    const { data, error: err } = await supabase.rpc('skip_egg_hour', { p_egg_id: eggId })
    if (err) {
      setError(err.message)
    } else {
      // Update local hatch_at
      setEggs(prev => prev.map(e =>
        e.id === eggId ? { ...e, hatch_at: data as string, hours_skipped: e.hours_skipped + 1 } : e
      ))
      await refreshProfile()
    }
    setSkipping(null)
  }

  const handleHatch = async (eggId: string) => {
    setError('')
    setHatching(eggId)
    const { data, error: err } = await supabase.rpc('hatch_egg', { p_egg_id: eggId })
    if (err) {
      setError(err.message)
    } else {
      const result = data as HatchResult
      setResults(prev => ({ ...prev, [eggId]: result }))
    }
    setHatching(null)
  }

  const handleBuySlot = async () => {
    setError('')
    setSlotBuying(true)
    const { data, error: err } = await supabase.rpc('buy_egg_slot')
    if (err) {
      setError(err.message)
    } else {
      setEggSlots(data as number)
      await refreshProfile()
    }
    setSlotBuying(false)
  }

  const activeEggs = eggs.filter(e => !results[e.id])
  const coins      = profile?.coins ?? 0

  return (
    <div className="hatchery-page">
      <div className="hatchery-header">
        <div>
          <h1 className="hatchery-title">Hatchery</h1>
          <p className="hatchery-subtitle">Your eggs are incubating here</p>
        </div>
        <div className="hatchery-coins-badge">🪙 {coins.toLocaleString()}</div>
      </div>

      <SlotBar
        used={activeEggs.length}
        total={eggSlots}
        coins={coins}
        onBuySlot={handleBuySlot}
      />

      {slotBuying && (
        <p className="hatchery-slot-msg">Unlocking slot…</p>
      )}

      {error && (
        <div className="hatchery-error">⚠️ {error}</div>
      )}

      {loading ? (
        <div className="hatchery-loading">🐾</div>
      ) : eggs.length === 0 ? (
        <div className="hatchery-empty">
          <span className="hatchery-empty-egg">🥚</span>
          <p>No eggs yet!</p>
          <Link to="/shop" className="hatchery-shop-btn">Buy an Egg →</Link>
        </div>
      ) : (
        <div className="hatchery-grid">
          {eggs.map(egg => (
            <EggCard
              key={egg.id}
              egg={egg}
              now={now}
              coins={coins}
              skipping={skipping === egg.id}
              hatching={hatching === egg.id}
              result={results[egg.id] ?? null}
              onSkip={() => handleSkip(egg.id)}
              onHatch={() => handleHatch(egg.id)}
            />
          ))}
        </div>
      )}

      <div className="hatchery-shop-row">
        <Link to="/shop" className="hatchery-to-shop">
          ← Back to Egg Shop
        </Link>
      </div>
    </div>
  )
}
