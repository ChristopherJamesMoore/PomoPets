export type PetRarity      = 'common' | 'uncommon' | 'rare' | 'legendary' | 'prismatic' | 'limited'
export type PetAvailability = 'standard' | 'limited' | 'retired'

export interface PetCatalogItem {
  id:             string
  name:           string
  description:    string | null
  species:        string
  coin_cost:      number
  availability:   PetAvailability
  available_from: string | null
  available_until: string | null
  egg_asset_key:  string | null
  base_hunger:    number
  base_health:    number
  base_energy:    number
  hatch_hours:    number
  is_active:      boolean
  sort_order:     number
  created_at:     string
}

export interface PetVariant {
  id:              string
  catalog_pet_id:  string
  rarity:          PetRarity
  asset_key:       string
  stat_multiplier: number
  drop_weight:     number
}

export interface PetAbility {
  id:           string
  name:         string
  description:  string
  icon_key:     string | null
  unlock_level: number
  min_rarity:   PetRarity
  effect_type:  string
  effect_value: number
  is_active:    boolean
  sort_order:   number
  created_at:   string
}

export interface UserPet {
  id:             string
  user_id:        string
  catalog_pet_id: string
  nickname:       string | null
  is_selected:    boolean
  level:          number
  xp:             number
  hunger:         number
  health:         number
  energy:         number
  rarity:         PetRarity
  asset_key:      string | null
  last_fed_at:    string | null
  last_played_at: string | null
  acquired_at:    string
  catalog_pet?:   PetCatalogItem
}

export interface PetEgg {
  id:             string
  user_id:        string
  catalog_pet_id: string
  hatch_at:       string
  hatched_at:     string | null
  hours_skipped:  number
  created_at:     string
  catalog_pet?:   PetCatalogItem
}
