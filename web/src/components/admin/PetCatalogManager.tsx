import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { PetCatalogItem, PetVariant, PetAbility, PetRarity, PetAvailability } from '../../types/pets'

// ── Constants ────────────────────────────────────────────────────────────────
const RARITIES: PetRarity[] = ['common', 'uncommon', 'rare', 'legendary', 'prismatic', 'limited']

const DEFAULT_WEIGHTS: Record<PetRarity, number> = {
  common: 550, uncommon: 250, rare: 130, legendary: 50, prismatic: 20, limited: 0,
}
const DEFAULT_MULTIPLIERS: Record<PetRarity, number> = {
  common: 1.0, uncommon: 1.1, rare: 1.25, legendary: 1.5, prismatic: 2.0, limited: 1.5,
}
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
const EFFECT_TYPES = ['none', 'coin_boost', 'xp_boost', 'stat_regen', 'study_bonus']

// ── Pet image upload ─────────────────────────────────────────────────────────
interface PetImageUploadProps {
  storagePath: string
  currentUrl:  string
  label:       string
  size?:       number
  onUploaded:  (url: string) => void
}

function PetImageUpload({ storagePath, currentUrl, label, size = 64, onUploaded }: PetImageUploadProps) {
  const inputRef             = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr]             = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setErr('Image only'); return }
    if (file.size > 3 * 1024 * 1024)    { setErr('Max 3 MB');   return }
    setErr('')
    setUploading(true)
    const { error } = await supabase.storage
      .from('pet-assets')
      .upload(storagePath, file, { upsert: true, contentType: file.type })
    if (error) { setErr(error.message); setUploading(false); return }
    const { data } = supabase.storage.from('pet-assets').getPublicUrl(storagePath)
    onUploaded(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  return (
    <div
      className="pet-img-upload"
      style={{ width: size, height: size }}
      onClick={() => !uploading && inputRef.current?.click()}
      title={`Upload ${label}`}
    >
      {currentUrl
        ? <img src={currentUrl} alt={label} className="pet-img-preview" />
        : <span className="pet-img-placeholder">+</span>
      }
      {uploading && <div className="pet-img-spinner">…</div>}
      {err && <span className="pet-img-err">{err}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
        onClick={e => (e.currentTarget.value = '')}
      />
    </div>
  )
}

// ── Image upload with centering preview ──────────────────────────────────────
interface ImageWithOffsetProps {
  storagePath: string
  url:         string
  label:       string
  offsetX:     number
  offsetY:     number
  size?:       number
  onUploaded:  (url: string) => void
  onChange:    (x: number, y: number) => void
}

function ImageWithOffset({
  storagePath, url, label, offsetX, offsetY, size = 64, onUploaded, onChange,
}: ImageWithOffsetProps) {
  return (
    <div className="pet-img-offset-wrap">
      <PetImageUpload
        storagePath={storagePath}
        currentUrl={url}
        label={label}
        size={size}
        onUploaded={onUploaded}
      />
      <div className="pet-img-center-preview" title="Centering preview — adjust X/Y to centre the subject">
        {url
          ? <img
              src={url} alt={label}
              className="pet-img-center-img"
              style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
            />
          : <span className="pet-img-center-empty">preview</span>
        }
        <div className="pet-img-crosshair-h" />
        <div className="pet-img-crosshair-v" />
      </div>
      <div className="pet-img-offset-inputs">
        <label>
          X
          <input
            type="number" min={-80} max={80} value={offsetX}
            onChange={e => onChange(Number(e.target.value), offsetY)}
            onFocus={e => e.target.select()}
          />
        </label>
        <label>
          Y
          <input
            type="number" min={-80} max={80} value={offsetY}
            onChange={e => onChange(offsetX, Number(e.target.value))}
            onFocus={e => e.target.select()}
          />
        </label>
      </div>
    </div>
  )
}

// ── Create-form variant state ─────────────────────────────────────────────────
interface CreateVariantState {
  url:        string
  offsetX:    number
  offsetY:    number
  weight:     number
  multiplier: number
}

function defaultVariants(): Record<PetRarity, CreateVariantState> {
  return Object.fromEntries(
    RARITIES.map(r => [r, {
      url: '', offsetX: 0, offsetY: 0,
      weight: DEFAULT_WEIGHTS[r], multiplier: DEFAULT_MULTIPLIERS[r],
    }])
  ) as Record<PetRarity, CreateVariantState>
}

// ── Create variant card (no individual save — part of the create form) ───────
interface CreateVariantCardProps {
  petId:    string
  rarity:   PetRarity
  value:    CreateVariantState
  onChange: (rarity: PetRarity, state: CreateVariantState) => void
}

function CreateVariantCard({ petId, rarity, value, onChange }: CreateVariantCardProps) {
  const color = RARITY_COLORS[rarity]
  const set = (patch: Partial<CreateVariantState>) => onChange(rarity, { ...value, ...patch })

  return (
    <div className="pet-variant-card" style={{ '--rarity-color': color } as React.CSSProperties}>
      <div className="pet-variant-rarity" style={{ color }}>{RARITY_LABELS[rarity]}</div>

      <ImageWithOffset
        storagePath={`pets/${petId}/${rarity}`}
        url={value.url}
        label={`${rarity} sprite`}
        offsetX={value.offsetX}
        offsetY={value.offsetY}
        size={60}
        onUploaded={url => set({ url })}
        onChange={(x, y) => set({ offsetX: x, offsetY: y })}
      />

      <div className="pet-variant-fields">
        <label>
          Weight
          <input
            type="number" min={0} max={9999} value={value.weight}
            onChange={e => set({ weight: Number(e.target.value) })}
            onFocus={e => e.target.select()}
          />
        </label>
        <label>
          ×Stats
          <input
            type="number" min={0.1} max={10} step={0.05} value={value.multiplier}
            onChange={e => set({ multiplier: Number(e.target.value) })}
            onFocus={e => e.target.select()}
          />
        </label>
      </div>
    </div>
  )
}

// ── Rarity variant card (edit form — has its own save button) ────────────────
interface VariantCardProps {
  petId:   string
  rarity:  PetRarity
  variant: PetVariant | null
  onSave:  (
    rarity:          PetRarity,
    asset_key:       string,
    drop_weight:     number,
    stat_multiplier: number,
    offset_x:        number,
    offset_y:        number,
  ) => Promise<void>
}

function VariantCard({ petId, rarity, variant, onSave }: VariantCardProps) {
  const [weight,  setWeight]  = useState(variant?.drop_weight     ?? DEFAULT_WEIGHTS[rarity])
  const [multi,   setMulti]   = useState(variant?.stat_multiplier ?? DEFAULT_MULTIPLIERS[rarity])
  const [url,     setUrl]     = useState(variant?.asset_key       ?? '')
  const [offsetX, setOffsetX] = useState(variant?.offset_x       ?? 0)
  const [offsetY, setOffsetY] = useState(variant?.offset_y       ?? 0)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    setWeight(variant?.drop_weight     ?? DEFAULT_WEIGHTS[rarity])
    setMulti(variant?.stat_multiplier  ?? DEFAULT_MULTIPLIERS[rarity])
    setUrl(variant?.asset_key          ?? '')
    setOffsetX(variant?.offset_x       ?? 0)
    setOffsetY(variant?.offset_y       ?? 0)
  }, [variant, rarity])

  const handleSave = async () => {
    setSaving(true)
    await onSave(rarity, url, weight, multi, offsetX, offsetY)
    setSaving(false)
  }

  const color = RARITY_COLORS[rarity]

  return (
    <div className="pet-variant-card" style={{ '--rarity-color': color } as React.CSSProperties}>
      <div className="pet-variant-rarity" style={{ color }}>{RARITY_LABELS[rarity]}</div>

      <ImageWithOffset
        storagePath={`pets/${petId}/${rarity}`}
        url={url}
        label={`${rarity} sprite`}
        offsetX={offsetX}
        offsetY={offsetY}
        size={60}
        onUploaded={newUrl => setUrl(newUrl)}
        onChange={(x, y) => { setOffsetX(x); setOffsetY(y) }}
      />

      <div className="pet-variant-fields">
        <label>
          Weight
          <input
            type="number" min={0} max={9999} value={weight}
            onChange={e => setWeight(Number(e.target.value))}
            onFocus={e => e.target.select()}
          />
        </label>
        <label>
          ×Stats
          <input
            type="number" min={0.1} max={10} step={0.05} value={multi}
            onChange={e => setMulti(Number(e.target.value))}
            onFocus={e => e.target.select()}
          />
        </label>
      </div>

      <button className="pet-variant-save-btn" onClick={handleSave} disabled={saving || !url}>
        {saving ? '…' : variant ? '✓ Save' : '+ Add'}
      </button>
    </div>
  )
}

// ── Expanded pet body ────────────────────────────────────────────────────────
interface PetRowBodyProps {
  pet:                PetCatalogItem
  variants:           PetVariant[]
  abilities:          PetAbility[]
  assignedAbilityIds: string[]
  onUpdated:          () => void
}

function PetRowBody({ pet, variants, abilities, assignedAbilityIds, onUpdated }: PetRowBodyProps) {
  const [name,         setName]         = useState(pet.name)
  const [description,  setDescription]  = useState(pet.description ?? '')
  const [species,      setSpecies]      = useState(pet.species)
  const [coinCost,     setCoinCost]     = useState(pet.coin_cost)
  const [hatchHours,   setHatchHours]   = useState(pet.hatch_hours)
  const [baseHunger,   setBaseHunger]   = useState(pet.base_hunger)
  const [baseHealth,   setBaseHealth]   = useState(pet.base_health)
  const [baseEnergy,   setBaseEnergy]   = useState(pet.base_energy)
  const [availability, setAvailability] = useState<PetAvailability>(pet.availability)
  const [isActive,     setIsActive]     = useState(pet.is_active)
  const [eggUrl,       setEggUrl]       = useState(pet.egg_asset_key ?? '')
  const [eggOffsetX,   setEggOffsetX]   = useState(pet.egg_offset_x ?? 0)
  const [eggOffsetY,   setEggOffsetY]   = useState(pet.egg_offset_y ?? 0)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')

  const variantMap = Object.fromEntries(variants.map(v => [v.rarity, v])) as Record<PetRarity, PetVariant | undefined>

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const { error } = await supabase.from('pet_catalog').update({
      name:          name.trim(),
      description:   description.trim() || null,
      species:       species.trim(),
      coin_cost:     coinCost,
      hatch_hours:   hatchHours,
      base_hunger:   baseHunger,
      base_health:   baseHealth,
      base_energy:   baseEnergy,
      availability,
      is_active:     isActive,
      egg_asset_key: eggUrl || null,
      egg_offset_x:  eggOffsetX,
      egg_offset_y:  eggOffsetY,
    }).eq('id', pet.id)
    setSaveMsg(error ? `Error: ${error.message}` : 'Saved!')
    setSaving(false)
    if (!error) onUpdated()
  }

  const handleSaveVariant = async (
    rarity:          PetRarity,
    asset_key:       string,
    drop_weight:     number,
    stat_multiplier: number,
    offset_x:        number,
    offset_y:        number,
  ) => {
    const existing = variantMap[rarity]
    if (existing) {
      await supabase.from('pet_catalog_variants')
        .update({ asset_key, drop_weight, stat_multiplier, offset_x, offset_y })
        .eq('id', existing.id)
    } else {
      await supabase.from('pet_catalog_variants')
        .insert({ catalog_pet_id: pet.id, rarity, asset_key, drop_weight, stat_multiplier, offset_x, offset_y })
    }
    onUpdated()
  }

  const toggleAbility = async (abilityId: string) => {
    const has = assignedAbilityIds.includes(abilityId)
    if (has) {
      await supabase.from('pet_catalog_abilities')
        .delete()
        .eq('catalog_pet_id', pet.id)
        .eq('ability_id', abilityId)
    } else {
      await supabase.from('pet_catalog_abilities')
        .insert({ catalog_pet_id: pet.id, ability_id: abilityId })
    }
    onUpdated()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${pet.name}"? This cannot be undone.`)) return
    await supabase.from('pet_catalog').delete().eq('id', pet.id)
    onUpdated()
  }

  return (
    <div className="pet-row-body">

      {/* ── Basic info ── */}
      <form className="pet-info-form" onSubmit={handleSavePet}>
        <div className="admin-form-row">
          <div className="admin-form-field admin-form-field--grow">
            <label>Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} required />
          </div>
          <div className="admin-form-field admin-form-field--grow">
            <label>Species *</label>
            <input type="text" value={species} onChange={e => setSpecies(e.target.value)} maxLength={60} required />
          </div>
          <div className="admin-form-field">
            <label>Coin Cost</label>
            <input type="number" min={0} value={coinCost} onChange={e => setCoinCost(Number(e.target.value))} onFocus={e => e.target.select()} />
          </div>
          <div className="admin-form-field">
            <label>Hatch Hours</label>
            <input type="number" min={1} value={hatchHours} onChange={e => setHatchHours(Number(e.target.value))} onFocus={e => e.target.select()} />
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-field admin-form-field--grow">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} maxLength={200} />
          </div>
          <div className="admin-form-field">
            <label>Availability</label>
            <select value={availability} onChange={e => setAvailability(e.target.value as PetAvailability)}>
              <option value="standard">Standard</option>
              <option value="limited">Limited</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label>Active</label>
            <select value={isActive ? 'yes' : 'no'} onChange={e => setIsActive(e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-field">
            <label>Base Hunger</label>
            <input type="number" min={0} max={100} value={baseHunger} onChange={e => setBaseHunger(Number(e.target.value))} onFocus={e => e.target.select()} />
          </div>
          <div className="admin-form-field">
            <label>Base Health</label>
            <input type="number" min={0} max={100} value={baseHealth} onChange={e => setBaseHealth(Number(e.target.value))} onFocus={e => e.target.select()} />
          </div>
          <div className="admin-form-field">
            <label>Base Energy</label>
            <input type="number" min={0} max={100} value={baseEnergy} onChange={e => setBaseEnergy(Number(e.target.value))} onFocus={e => e.target.select()} />
          </div>
          {/* Egg image */}
          <div className="admin-form-field">
            <label>Egg Image</label>
            <ImageWithOffset
              storagePath={`pets/${pet.id}/egg`}
              url={eggUrl}
              label="egg"
              offsetX={eggOffsetX}
              offsetY={eggOffsetY}
              size={48}
              onUploaded={url => setEggUrl(url)}
              onChange={(x, y) => { setEggOffsetX(x); setEggOffsetY(y) }}
            />
          </div>
        </div>

        {saveMsg && (
          <p className={`admin-inline-msg ${saveMsg.startsWith('Error') ? 'admin-inline-msg--err' : ''}`}>
            {saveMsg}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-create-btn" disabled={saving}>
            {saving ? 'Saving…' : 'Save Pet'}
          </button>
          <button type="button" className="admin-delete-btn" style={{ padding: '6px 14px', borderRadius: 6 }} onClick={handleDelete}>
            Delete Pet
          </button>
        </div>
      </form>

      {/* ── Rarity variants ── */}
      <div className="pet-variants-section">
        <h4 className="pet-section-label">Rarity Variants — upload a sprite for each rarity</h4>
        <div className="pet-variants-grid">
          {RARITIES.map(r => (
            <VariantCard
              key={r}
              petId={pet.id}
              rarity={r}
              variant={variantMap[r] ?? null}
              onSave={handleSaveVariant}
            />
          ))}
        </div>
      </div>

      {/* ── Abilities assignment ── */}
      <div className="pet-abilities-section">
        <h4 className="pet-section-label">Assigned Abilities ({assignedAbilityIds.length})</h4>
        {abilities.length === 0 ? (
          <p className="admin-muted" style={{ fontSize: 13 }}>
            No abilities created yet — add them in the Abilities tab first.
          </p>
        ) : (
          <div className="pet-ability-assign-list">
            {abilities.map(a => (
              <label key={a.id} className="pet-ability-assign-item">
                <input
                  type="checkbox"
                  checked={assignedAbilityIds.includes(a.id)}
                  onChange={() => toggleAbility(a.id)}
                />
                <span className="pet-ability-assign-name">{a.name}</span>
                <span className="pet-ability-assign-meta">
                  Lv{a.unlock_level} •{' '}
                  <span style={{ color: RARITY_COLORS[a.min_rarity] }}>
                    {RARITY_LABELS[a.min_rarity]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Draggable pet row ────────────────────────────────────────────────────────
interface PetRowProps {
  pet:                PetCatalogItem
  variants:           PetVariant[]
  abilities:          PetAbility[]
  assignedAbilityIds: string[]
  isDragging:         boolean
  isDragOver:         boolean
  onDragStart:        (id: string) => void
  onDragOver:         (id: string) => void
  onDrop:             (id: string) => void
  onDragEnd:          () => void
  onUpdated:          () => void
}

function PetRow({
  pet, variants, abilities, assignedAbilityIds,
  isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd, onUpdated,
}: PetRowProps) {
  const [expanded, setExpanded] = useState(false)
  const commonVariant = variants.find(v => v.rarity === 'common')

  return (
    <div
      className={`pet-row${isDragging ? ' pet-row--dragging' : ''}${isDragOver ? ' pet-row--dragover' : ''}`}
      draggable
      onDragStart={() => onDragStart(pet.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(pet.id) }}
      onDrop={() => onDrop(pet.id)}
      onDragEnd={onDragEnd}
    >
      <div className="pet-row-header" onClick={() => setExpanded(x => !x)}>
        <span className="pet-row-drag" onMouseDown={e => e.stopPropagation()}>⠿</span>

        {/* Egg preview */}
        <div className="pet-row-thumb">
          {pet.egg_asset_key
            ? <img src={pet.egg_asset_key} alt="egg" />
            : <span>🥚</span>}
        </div>

        {/* Common sprite preview */}
        <div className="pet-row-thumb">
          {commonVariant?.asset_key
            ? <img src={commonVariant.asset_key} alt="common" />
            : <span style={{ fontSize: 11, color: '#bbb' }}>?</span>}
        </div>

        <div className="pet-row-info">
          <span className="pet-row-name">{pet.name}</span>
          <span className="pet-row-meta">
            {pet.species} · {pet.coin_cost} 🪙 · {pet.hatch_hours}h hatch
          </span>
        </div>

        <div className="pet-row-badges">
          {!pet.is_active && (
            <span className="pet-row-badge pet-row-badge--inactive">Inactive</span>
          )}
          <span className={`pet-row-badge pet-row-badge--${pet.availability}`}>
            {pet.availability}
          </span>
          <span className="pet-row-variant-count">
            {variants.length}/6 variants
          </span>
        </div>

        <span className="pet-row-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <PetRowBody
          pet={pet}
          variants={variants}
          abilities={abilities}
          assignedAbilityIds={assignedAbilityIds}
          onUpdated={() => { onUpdated(); /* keep expanded */ }}
        />
      )}
    </div>
  )
}

// ── Abilities sub-tab ────────────────────────────────────────────────────────
interface AbilitiesTabProps {
  abilities: PetAbility[]
  onRefresh: () => void
}

function AbilitiesTab({ abilities, onRefresh }: AbilitiesTabProps) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [iconKey,     setIconKey]     = useState('')
  const [unlockLevel, setUnlockLevel] = useState(1)
  const [minRarity,   setMinRarity]   = useState<PetRarity>('common')
  const [effectType,  setEffectType]  = useState('none')
  const [effectValue, setEffectValue] = useState(0)
  const [creating,    setCreating]    = useState(false)
  const [createErr,   setCreateErr]   = useState('')
  const [editId,      setEditId]      = useState<string | null>(null)

  const resetForm = () => {
    setName(''); setDescription(''); setIconKey('')
    setUnlockLevel(1); setMinRarity('common')
    setEffectType('none'); setEffectValue(0)
    setEditId(null)
  }

  const startEdit = (a: PetAbility) => {
    setName(a.name); setDescription(a.description); setIconKey(a.icon_key ?? '')
    setUnlockLevel(a.unlock_level); setMinRarity(a.min_rarity)
    setEffectType(a.effect_type); setEffectValue(a.effect_value)
    setEditId(a.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setCreateErr('Name is required.'); return }
    setCreateErr('')
    setCreating(true)
    const payload = {
      name:         name.trim(),
      description:  description.trim(),
      icon_key:     iconKey.trim() || null,
      unlock_level: unlockLevel,
      min_rarity:   minRarity,
      effect_type:  effectType,
      effect_value: effectValue,
    }
    if (editId) {
      await supabase.from('pet_abilities').update(payload).eq('id', editId)
    } else {
      const maxOrder = abilities.reduce((m, a) => Math.max(m, a.sort_order), 0)
      await supabase.from('pet_abilities').insert({ ...payload, sort_order: maxOrder + 10 })
    }
    resetForm()
    onRefresh()
    setCreating(false)
  }

  const handleDelete = async (id: string, abilityName: string) => {
    if (!confirm(`Delete ability "${abilityName}"?`)) return
    await supabase.from('pet_abilities').delete().eq('id', id)
    onRefresh()
  }

  const toggleActive = async (a: PetAbility) => {
    await supabase.from('pet_abilities').update({ is_active: !a.is_active }).eq('id', a.id)
    onRefresh()
  }

  return (
    <div>
      {/* Form */}
      <div className="admin-create-card">
        <h3 className="admin-create-title">{editId ? 'Edit Ability' : 'New Ability'}</h3>
        {createErr && <p className="admin-form-error">{createErr}</p>}
        <form onSubmit={handleSubmit} className="admin-create-form">
          <div className="admin-form-row">
            <div className="admin-form-field admin-form-field--grow">
              <label>Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60} required />
            </div>
            <div className="admin-form-field">
              <label>Unlock Level</label>
              <input type="number" min={1} value={unlockLevel}
                onChange={e => setUnlockLevel(Number(e.target.value))} onFocus={e => e.target.select()} />
            </div>
            <div className="admin-form-field">
              <label>Min Rarity</label>
              <select value={minRarity} onChange={e => setMinRarity(e.target.value as PetRarity)}>
                {RARITIES.map(r => (
                  <option key={r} value={r} style={{ color: RARITY_COLORS[r] }}>
                    {RARITY_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field admin-form-field--grow">
              <label>Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} maxLength={200} />
            </div>
            <div className="admin-form-field">
              <label>Icon Key <span className="admin-optional">optional</span></label>
              <input type="text" value={iconKey} onChange={e => setIconKey(e.target.value)} maxLength={60} placeholder="ability_name_key" />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-field">
              <label>Effect Type</label>
              <select value={effectType} onChange={e => setEffectType(e.target.value)}>
                {EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="admin-form-field">
              <label>Effect Value</label>
              <input type="number" step={0.01} value={effectValue}
                onChange={e => setEffectValue(Number(e.target.value))} onFocus={e => e.target.select()} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="admin-create-btn" disabled={creating}>
              {creating ? '…' : editId ? 'Update Ability' : '+ Add Ability'}
            </button>
            {editId && (
              <button type="button" className="admin-refresh-btn" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Level</th>
              <th>Min Rarity</th>
              <th>Effect</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {abilities.length === 0 && (
              <tr><td colSpan={7} className="admin-empty">No abilities yet.</td></tr>
            )}
            {abilities.map(a => (
              <tr key={a.id} className={!a.is_active ? 'admin-row--inactive' : ''}>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td className="admin-muted" style={{ maxWidth: 220, fontSize: 12 }}>
                  {a.description || '—'}
                </td>
                <td>Lv {a.unlock_level}</td>
                <td>
                  <span
                    className="pet-rarity-badge"
                    style={{ '--rarity-color': RARITY_COLORS[a.min_rarity] } as React.CSSProperties}
                  >
                    {RARITY_LABELS[a.min_rarity]}
                  </span>
                </td>
                <td className="admin-mono" style={{ fontSize: 12 }}>
                  {a.effect_type !== 'none' ? `${a.effect_type}: ${a.effect_value}` : '—'}
                </td>
                <td>
                  <button
                    className={`admin-toggle-btn ${a.is_active ? 'admin-toggle-btn--on' : ''}`}
                    onClick={() => toggleActive(a)}
                  >
                    {a.is_active ? 'On' : 'Off'}
                  </button>
                </td>
                <td className="admin-actions">
                  <button className="admin-copy-btn" onClick={() => startEdit(a)}>Edit</button>
                  <button className="admin-delete-btn" onClick={() => handleDelete(a.id, a.name)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main PetCatalogManager ───────────────────────────────────────────────────
type PetSubTab = 'pets' | 'abilities'

export default function PetCatalogManager() {
  const [subTab,           setSubTab]           = useState<PetSubTab>('pets')
  const [pets,             setPets]             = useState<PetCatalogItem[]>([])
  const [variants,         setVariants]         = useState<Record<string, PetVariant[]>>({})
  const [catalogAbilities, setCatalogAbilities] = useState<Record<string, string[]>>({})
  const [abilities,        setAbilities]        = useState<PetAbility[]>([])
  const [loading,          setLoading]          = useState(true)

  // Drag state
  const [draggedId,  setDraggedId]  = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Create form visibility
  const [createOpen, setCreateOpen] = useState(false)

  // Create form: basic fields
  const [createId,           setCreateId]           = useState(() => crypto.randomUUID())
  const [createName,         setCreateName]         = useState('')
  const [createSpecies,      setCreateSpecies]      = useState('')
  const [createDesc,         setCreateDesc]         = useState('')
  const [createCost,         setCreateCost]         = useState(100)
  const [createHatchHours,   setCreateHatchHours]   = useState(48)
  const [createAvailability, setCreateAvailability] = useState<PetAvailability>('standard')

  // Create form: egg image
  const [createEggUrl,     setCreateEggUrl]     = useState('')
  const [createEggOffsetX, setCreateEggOffsetX] = useState(0)
  const [createEggOffsetY, setCreateEggOffsetY] = useState(0)

  // Create form: rarity variants
  const [createVariants, setCreateVariants] = useState<Record<PetRarity, CreateVariantState>>(defaultVariants)

  // Create form: abilities
  const [createAbilityIds, setCreateAbilityIds] = useState<string[]>([])

  const [creating,   setCreating]   = useState(false)
  const [createErr,  setCreateErr]  = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [
      { data: petData },
      { data: variantData },
      { data: abilityData },
      { data: catalogAbilityData },
    ] = await Promise.all([
      supabase.from('pet_catalog').select('*').order('sort_order', { ascending: true }),
      supabase.from('pet_catalog_variants').select('*'),
      supabase.from('pet_abilities').select('*').order('sort_order', { ascending: true }).order('unlock_level', { ascending: true }),
      supabase.from('pet_catalog_abilities').select('*'),
    ])

    setPets((petData as PetCatalogItem[]) ?? [])
    setAbilities((abilityData as PetAbility[]) ?? [])

    const vMap: Record<string, PetVariant[]> = {}
    for (const v of (variantData as PetVariant[]) ?? []) {
      if (!vMap[v.catalog_pet_id]) vMap[v.catalog_pet_id] = []
      vMap[v.catalog_pet_id].push(v)
    }
    setVariants(vMap)

    const aMap: Record<string, string[]> = {}
    for (const ca of (catalogAbilityData as { catalog_pet_id: string; ability_id: string }[]) ?? []) {
      if (!aMap[ca.catalog_pet_id]) aMap[ca.catalog_pet_id] = []
      aMap[ca.catalog_pet_id].push(ca.ability_id)
    }
    setCatalogAbilities(aMap)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const resetCreateForm = () => {
    setCreateId(crypto.randomUUID())
    setCreateName('')
    setCreateSpecies('')
    setCreateDesc('')
    setCreateCost(100)
    setCreateHatchHours(48)
    setCreateAvailability('standard')
    setCreateEggUrl('')
    setCreateEggOffsetX(0)
    setCreateEggOffsetY(0)
    setCreateVariants(defaultVariants())
    setCreateAbilityIds([])
    setCreateErr('')
    setCreateOpen(false)
  }

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim() || !createSpecies.trim()) {
      setCreateErr('Name and species are required.')
      return
    }
    setCreateErr('')
    setCreating(true)

    const petId    = createId
    const maxOrder = pets.reduce((m, p) => Math.max(m, p.sort_order), -1)

    // 1 — Insert the pet row
    const { error: petError } = await supabase.from('pet_catalog').insert({
      id:            petId,
      name:          createName.trim(),
      description:   createDesc.trim() || null,
      species:       createSpecies.trim(),
      coin_cost:     createCost,
      hatch_hours:   createHatchHours,
      availability:  createAvailability,
      sort_order:    maxOrder + 1,
      base_hunger:   80,
      base_health:   100,
      base_energy:   80,
      egg_asset_key: createEggUrl || null,
      egg_offset_x:  createEggOffsetX,
      egg_offset_y:  createEggOffsetY,
    })

    if (petError) {
      setCreateErr(`Error: ${petError.message}`)
      setCreating(false)
      return
    }

    // 2 — Insert all 6 variant rows (even if no image yet — weights and multipliers are saved)
    await supabase.from('pet_catalog_variants').insert(
      RARITIES.map(r => ({
        catalog_pet_id:  petId,
        rarity:          r,
        asset_key:       createVariants[r].url || null,
        drop_weight:     createVariants[r].weight,
        stat_multiplier: createVariants[r].multiplier,
        offset_x:        createVariants[r].offsetX,
        offset_y:        createVariants[r].offsetY,
      }))
    )

    // 3 — Insert ability assignments
    if (createAbilityIds.length > 0) {
      await supabase.from('pet_catalog_abilities').insert(
        createAbilityIds.map(abilityId => ({ catalog_pet_id: petId, ability_id: abilityId }))
      )
    }

    resetCreateForm()
    await fetchAll()
    setCreating(false)
  }

  const handleVariantChange = (rarity: PetRarity, state: CreateVariantState) => {
    setCreateVariants(prev => ({ ...prev, [rarity]: state }))
  }

  const addAbility = (id: string) => {
    if (id && !createAbilityIds.includes(id)) {
      setCreateAbilityIds(prev => [...prev, id])
    }
  }

  const removeAbility = (id: string) => {
    setCreateAbilityIds(prev => prev.filter(x => x !== id))
  }

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    const fromIdx = pets.findIndex(p => p.id === draggedId)
    const toIdx   = pets.findIndex(p => p.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const reordered = [...pets]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setPets(reordered) // optimistic
    await Promise.all(
      reordered.map((p, i) => supabase.from('pet_catalog').update({ sort_order: i }).eq('id', p.id))
    )
  }

  return (
    <div className="admin-section">
      {/* Sub-tabs */}
      <div className="pet-sub-tabs">
        <button
          className={`pet-sub-tab${subTab === 'pets' ? ' pet-sub-tab--active' : ''}`}
          onClick={() => setSubTab('pets')}
        >
          Pets <span className="admin-tab-count">{pets.length}</span>
        </button>
        <button
          className={`pet-sub-tab${subTab === 'abilities' ? ' pet-sub-tab--active' : ''}`}
          onClick={() => setSubTab('abilities')}
        >
          Abilities <span className="admin-tab-count">{abilities.length}</span>
        </button>
        <button className="admin-refresh-btn" style={{ marginLeft: 'auto' }} onClick={fetchAll} disabled={loading}>
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {/* ── Pets sub-tab ── */}
      {subTab === 'pets' && (
        <>
          {/* ── Add New Pet card ── */}
          <div className="admin-create-card">
            <div className="pet-create-header">
              <h3 className="admin-create-title" style={{ margin: 0 }}>Add New Pet</h3>
              <button
                type="button"
                className={`pet-create-toggle ${createOpen ? 'pet-create-toggle--open' : ''}`}
                onClick={() => setCreateOpen(x => !x)}
              >
                {createOpen ? '▲ Collapse' : '▼ Expand'}
              </button>
            </div>

            {createOpen && (
              <form onSubmit={handleCreatePet} className="admin-create-form pet-create-form">
                {createErr && <p className="admin-form-error">{createErr}</p>}

                {/* ── Section 1: Basic info ── */}
                <div className="pet-create-section">
                  <p className="pet-create-section-label">Basic Info</p>
                  <div className="admin-form-row">
                    <div className="admin-form-field admin-form-field--grow">
                      <label>Pet Name *</label>
                      <input
                        type="text" value={createName}
                        onChange={e => setCreateName(e.target.value)}
                        maxLength={60} placeholder="e.g. Ember Fox" required
                      />
                    </div>
                    <div className="admin-form-field admin-form-field--grow">
                      <label>Species *</label>
                      <input
                        type="text" value={createSpecies}
                        onChange={e => setCreateSpecies(e.target.value)}
                        maxLength={60} placeholder="e.g. Fox" required
                      />
                    </div>
                    <div className="admin-form-field">
                      <label>Coin Cost</label>
                      <input
                        type="number" min={0} value={createCost}
                        onChange={e => setCreateCost(Number(e.target.value))}
                        onFocus={e => e.target.select()}
                      />
                    </div>
                    <div className="admin-form-field">
                      <label>Hatch Hours</label>
                      <input
                        type="number" min={1} value={createHatchHours}
                        onChange={e => setCreateHatchHours(Number(e.target.value))}
                        onFocus={e => e.target.select()}
                      />
                    </div>
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-field admin-form-field--grow">
                      <label>Description</label>
                      <input
                        type="text" value={createDesc}
                        onChange={e => setCreateDesc(e.target.value)}
                        maxLength={200} placeholder="Short description shown in shop"
                      />
                    </div>
                    <div className="admin-form-field">
                      <label>Availability</label>
                      <select value={createAvailability} onChange={e => setCreateAvailability(e.target.value as PetAvailability)}>
                        <option value="standard">Standard</option>
                        <option value="limited">Limited</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Egg image ── */}
                <div className="pet-create-section">
                  <p className="pet-create-section-label">Egg Image</p>
                  <p className="admin-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    Upload the egg sprite. Use X/Y offsets to centre the subject in the preview.
                  </p>
                  <ImageWithOffset
                    storagePath={`pets/${createId}/egg`}
                    url={createEggUrl}
                    label="egg"
                    offsetX={createEggOffsetX}
                    offsetY={createEggOffsetY}
                    size={72}
                    onUploaded={url => setCreateEggUrl(url)}
                    onChange={(x, y) => { setCreateEggOffsetX(x); setCreateEggOffsetY(y) }}
                  />
                </div>

                {/* ── Section 3: Rarity variants ── */}
                <div className="pet-create-section">
                  <p className="pet-create-section-label">Rarity Variants</p>
                  <p className="admin-muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    Upload a sprite for each rarity. Weights and multipliers are pre-filled with defaults — adjust as needed. All 6 variant rows are saved automatically when you add the pet.
                  </p>
                  <div className="pet-variants-grid">
                    {RARITIES.map(r => (
                      <CreateVariantCard
                        key={r}
                        petId={createId}
                        rarity={r}
                        value={createVariants[r]}
                        onChange={handleVariantChange}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Section 4: Abilities ── */}
                <div className="pet-create-section">
                  <p className="pet-create-section-label">Assign Abilities</p>
                  {abilities.length === 0 ? (
                    <p className="admin-muted" style={{ fontSize: 13 }}>
                      No abilities yet — create them in the Abilities tab first.
                    </p>
                  ) : (
                    <div className="pet-ability-multiselect">
                      <select
                        value=""
                        onChange={e => addAbility(e.target.value)}
                        className="pet-ability-dropdown"
                      >
                        <option value="">+ Add ability…</option>
                        {abilities
                          .filter(a => !createAbilityIds.includes(a.id))
                          .map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} — Lv {a.unlock_level} · {RARITY_LABELS[a.min_rarity]}
                            </option>
                          ))
                        }
                      </select>
                      {createAbilityIds.length > 0 && (
                        <div className="pet-ability-chips">
                          {createAbilityIds.map(id => {
                            const ability = abilities.find(a => a.id === id)
                            if (!ability) return null
                            return (
                              <span
                                key={id}
                                className="pet-ability-chip"
                                style={{ '--rarity-color': RARITY_COLORS[ability.min_rarity] } as React.CSSProperties}
                              >
                                {ability.name}
                                <span className="pet-ability-chip-meta">
                                  Lv{ability.unlock_level}
                                </span>
                                <button
                                  type="button"
                                  className="pet-ability-chip-remove"
                                  onClick={() => removeAbility(id)}
                                >
                                  ✕
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Submit ── */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button type="submit" className="admin-create-btn" disabled={creating}>
                    {creating ? 'Creating…' : '+ Add Pet'}
                  </button>
                  <button type="button" className="admin-refresh-btn" onClick={resetCreateForm}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {loading ? (
            <p className="admin-empty">Loading…</p>
          ) : pets.length === 0 ? (
            <p className="admin-empty">No pets yet. Add one above.</p>
          ) : (
            <div className="pet-list">
              <p className="admin-muted" style={{ fontSize: 12, margin: '0 0 8px' }}>
                Drag rows to reorder. Click to expand and edit.
              </p>
              {pets.map(pet => (
                <PetRow
                  key={pet.id}
                  pet={pet}
                  variants={variants[pet.id] ?? []}
                  abilities={abilities}
                  assignedAbilityIds={catalogAbilities[pet.id] ?? []}
                  isDragging={draggedId === pet.id}
                  isDragOver={dragOverId === pet.id}
                  onDragStart={setDraggedId}
                  onDragOver={setDragOverId}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                  onUpdated={fetchAll}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Abilities sub-tab ── */}
      {subTab === 'abilities' && (
        <AbilitiesTab abilities={abilities} onRefresh={fetchAll} />
      )}
    </div>
  )
}
