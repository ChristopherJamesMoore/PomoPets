# PomoPets Development Log

A running record of features built, schema changes made, and decisions taken during development.

---

## Session — March 2026

### Audit Logging
Wired fire-and-forget audit logging across the app via a `logEvent()` utility.

- `AuthContext` — logs `user.login` on sign-in and `user.logout` on sign-out
- `ProfileSetupPage` — logs `profile.setup` with display name on first save
- `SettingsPage` — logs `profile.updated` with a flag indicating whether the name changed
- `AvatarUpload` — logs `avatar.uploaded` after a successful upload
- `usePomodoroSession` — logs `study.session_started` and `study.session_finished` with session stats

---

### Landing Page
- Removed the "Get Started" button from the hero CTA
- Added a "Join the Waitlist" primary button routing to `/waitlist`
- Replaced the secondary waitlist button with a Discord invite button (`https://discord.gg/zrdMJ4yngz`) with an inline SVG icon

---

### Pet & Egg System

#### Database Schema
New and modified tables:

```sql
-- Pet catalog
ALTER TABLE pet_catalog
  ADD COLUMN description      text,
  ADD COLUMN availability     text NOT NULL DEFAULT 'standard',
  ADD COLUMN available_from   timestamptz,
  ADD COLUMN available_until  timestamptz,
  ADD COLUMN egg_asset_key    text,
  ADD COLUMN egg_offset_x     integer NOT NULL DEFAULT 0,
  ADD COLUMN egg_offset_y     integer NOT NULL DEFAULT 0,
  ADD COLUMN base_hunger      integer NOT NULL DEFAULT 80,
  ADD COLUMN base_health      integer NOT NULL DEFAULT 100,
  ADD COLUMN base_energy      integer NOT NULL DEFAULT 80,
  ADD COLUMN hatch_hours      integer NOT NULL DEFAULT 48,
  ADD COLUMN is_active        boolean NOT NULL DEFAULT true,
  ADD COLUMN sort_order       integer NOT NULL DEFAULT 0;

-- Rarity variants (one row per rarity per pet)
ALTER TABLE pet_catalog_variants
  ADD COLUMN offset_x integer NOT NULL DEFAULT 0,
  ADD COLUMN offset_y integer NOT NULL DEFAULT 0;

-- User theme preference
ALTER TABLE profiles
  ADD COLUMN theme     text NOT NULL DEFAULT 'rose',
  ADD COLUMN is_admin  boolean NOT NULL DEFAULT false;
```

#### Rarity System
Six rarities with default drop weights and stat multipliers:

| Rarity    | Weight | Stat ×  |
|-----------|--------|---------|
| Common    | 550    | 1.00    |
| Uncommon  | 250    | 1.10    |
| Rare      | 130    | 1.25    |
| Legendary | 50     | 1.50    |
| Prismatic | 20     | 2.00    |
| Limited   | 0      | 1.50    |

#### Supabase RPC Functions
Required functions (must exist in the database):

- `buy_egg(p_user_id, p_catalog_pet_id)` — deducts coins, inserts a `pet_eggs` row
- `hatch_egg(p_egg_id)` — resolves rarity via weights, inserts `user_pets` row, marks egg hatched
- `skip_egg_hour(p_egg_id)` — deducts 15 coins, advances `hatch_at` by 1 hour
- `buy_egg_slot(p_user_id)` — deducts 100 coins, increments `egg_slots` on profile (max 5)
- `earn_coins(p_user_id, p_amount, p_type, p_note)` — adds coins and logs to `coin_transactions`
- `spend_coins(p_user_id, p_amount, p_type, p_note)` — deducts coins (floor 0), logs to `coin_transactions`

> Note: `coin_transactions` uses column `transaction_type` (not `type`) and has a check constraint requiring `amount > 0`.

#### RLS Policies Required
```sql
-- pet_catalog (read for all authenticated, write for admins only)
CREATE POLICY "Anyone can read pet catalog" ON pet_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert pet_catalog" ON pet_catalog FOR INSERT TO authenticated WITH CHECK (...);
CREATE POLICY "Admins can update pet_catalog" ON pet_catalog FOR UPDATE TO authenticated USING (...);
CREATE POLICY "Admins can delete pet_catalog" ON pet_catalog FOR DELETE TO authenticated USING (...);

-- Same pattern for: pet_catalog_variants, pet_abilities, pet_catalog_abilities

-- user_pets
CREATE POLICY "Users can read own pets" ON user_pets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own pets" ON user_pets FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- user_pet_abilities
CREATE POLICY "Users can read own pet abilities" ON user_pet_abilities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_pets WHERE id = user_pet_id AND user_id = auth.uid()));
```

---

### Pages Built

#### `/shop` — Shop Page
- Fetches `pet_catalog` with variants and computes drop % per rarity from weights
- Egg cards: bob animation, species, hatch time chip, collapsible rarity odds
- Shows slot warning if all egg slots are full
- Calls `buy_egg` RPC on purchase

#### `/hatchery` — Hatchery Page
- Live countdown via 1-second `setInterval` on a shared `now` state
- Slot bar showing 5 pips (filled / empty / locked) with buy-slot button (100 coins, max 5)
- Per-egg: countdown, progress bar, skip-hour button (15 coins), hatch button when ready
- Hatch reveal card with rarity-coloured border + glow animation
- Calls `skip_egg_hour`, `hatch_egg`, `buy_egg_slot` RPCs

#### `/pets` — Collection Page
- 3-column grid with filter pills (by rarity), search, and sort (rarity / level / newest / name)
- Pet cards: sprite with float animation, rarity badge, 3 mini stat bars, active indicator
- Slide-in detail panel: level + XP bar, full stat bars, abilities list, nickname form, set-active button
- `handleSelect`: unsets all pets then sets the chosen one

---

### Admin Panel — Pets Tab (`/admin`)

#### Add New Pet Form (expanded)
A collapsible create form with 4 sections:
1. **Basic Info** — name, species, coin cost, hatch hours, description, availability (+ release/end dates for Limited pets)
2. **Egg Image** — upload with centering preview (checkered canvas, crosshair guides, X/Y offset inputs ±80px)
3. **Rarity Variants** — all 6 rarity cards inline: image upload + centering controls + weight + stat multiplier (defaults pre-filled)
4. **Assign Abilities** — dropdown of created abilities, selected ones shown as rarity-coloured chips

On submit: inserts pet with pre-generated UUID, all 6 variant rows, and ability assignments atomically.

#### Edit Form (expanded row)
Same image upload with centering controls available when expanding an existing pet row. Variant save buttons are per-rarity.

#### Abilities Sub-tab
Create / edit / toggle-active / delete abilities. Fields: name, description, icon key, unlock level, min rarity, effect type, effect value.

#### Drag-to-Reorder
HTML5 draggable API — drag pet rows to reorder, updates `sort_order` for all affected rows in DB.

---

### Theme System

Two themes selectable in **Settings → Appearance**:

| Variable          | Rose (default)                    | Snow                              |
|-------------------|-----------------------------------|-----------------------------------|
| `--color-bg`      | `#fdf6ee` (cream)                 | `#ffffff` (white)                 |
| `--color-surface` | `#ffffff` (white cards)           | `#fdf6ee` (cream cards)           |
| `--color-text`    | `#3C0008` (maroon)                | `#3C0008` (maroon)                |
| `--color-pink`    | `#f5d0d6`                         | `#f5d0d6`                         |
| `--color-muted`   | `#a08090`                         | `#888888`                         |
| `--color-nav-bg`  | `rgba(253, 246, 238, 0.92)`       | `rgba(255, 255, 255, 0.95)`       |

Applied via `data-theme` attribute on `<html>`. Persisted to `profiles.theme` and loaded on every login via `AuthContext`.

---

### UI Redesign (Pitch Polish)

#### Game Home (`/home`)
- **Two-column layout** at 920px: pet house full-height on the left, nav tiles on the right
- Pet house: 110px rarity-tinted sprite frame, larger name, rarity tag pill, stat bars
- Empty state: large egg visual, descriptive copy, CTA button to shop
- Nav tiles: vertical list with icon box, label, sub-text, animated right-arrow on hover
- Mobile: stacks to single column, tiles become a 2-column grid

#### Nav Bar
- Height increased to 66px with subtle box shadow
- Heavier logo (900 weight, 20px), nav links use muted colour with maroon on active/hover
- Coins badge has a light shadow, avatar scales slightly on hover
- Dropdown has a name separator line

#### Page Widths (desktop breathing room)
| Page      | Before | After  |
|-----------|--------|--------|
| Shop      | 560px  | 680px  |
| Hatchery  | 520px  | 640px  |
| Settings  | 520px  | 600px  |
| Pomodoro  | 560px  | 620px  |

#### PomodoroPage
All hardcoded colours replaced with CSS theme variables — fully theme-aware.

---

### Repo Structure
Renamed directories for clarity:

| Old name          | New name  |
|-------------------|-----------|
| `pomopetsLanding` | `web`     |
| `mobile-app`      | `ios`     |
| `react-app`       | _(deleted)_ |

READMEs added for root, `web/`, and `ios/`.

---

## Key Decisions & Notes

- **Pre-generated UUID** for new pets: images are uploaded to `pet-assets/pets/{uuid}/{rarity}` before the DB row is inserted, avoiding a two-step upload flow.
- **Variant rows always created**: all 6 rarity variant rows are inserted on pet creation even if no image is uploaded, so weights and multipliers are always present.
- **Coins constraint**: `coin_transactions.amount` must be positive — `spend_coins` inserts the absolute value; the `transaction_type` column distinguishes debits from credits.
- **Admin access**: controlled by `profiles.is_admin` boolean. Set manually via SQL for now.
- **Theme applied early**: `document.documentElement.setAttribute('data-theme', ...)` is called inside `fetchProfile` in `AuthContext` so the theme is applied before the first render after login.
