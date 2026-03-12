# PomoPets Supabase DB Schema

> Copied from Supabase and extended locally — for context only, not meant to be executed directly.

---

## Tables

```sql
-- ── profiles ──────────────────────────────────────────────────────────────────
-- coins column holds the live balance. DEFAULT 100 gives every new user their
-- signup bonus automatically. A CHECK constraint prevents the balance from
-- ever going negative at the database level.
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NOT NULL DEFAULT ''::text,
  avatar_url text,
  coins integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  display_name_changed_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_coins_non_negative CHECK (coins >= 0)
);

-- ── habits ────────────────────────────────────────────────────────────────────
CREATE TABLE public.habits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'check'::text,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habits_pkey PRIMARY KEY (id),
  CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- ── habit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE public.habit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT habit_logs_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id)
);

-- ── coin_transactions ─────────────────────────────────────────────────────────
-- Immutable ledger. Every coin movement (earn or spend) writes one row here
-- AND updates profiles.coins atomically inside spend_coins / earn_coins.
-- amount is always positive; direction is encoded in transaction_type.
-- source_id is a nullable reference to whatever triggered the transaction
-- (e.g. a habit_log id, a shop item id, etc.).
CREATE TABLE public.coin_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  source_id uuid,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coin_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT coin_transactions_amount_positive CHECK (amount > 0),
  CONSTRAINT coin_transactions_type_check CHECK (
    transaction_type IN (
      'signup_bonus',       -- 100 coins on account creation
      'pomodoro_complete',  -- earned by finishing a focus session
      'habit_complete',     -- earned by logging a habit
      'streak_bonus',       -- bonus for maintaining a streak
      'pet_purchase',       -- spent buying a new pet
      'pet_item',           -- spent on food / accessories for a pet
      'shop_item',          -- spent in the general shop
      'manual_adjustment'   -- admin / support correction
    )
  )
);
```

---

## Functions

```sql
-- ── earn_coins ────────────────────────────────────────────────────────────────
-- Adds coins to a user and records the transaction in one atomic operation.
-- Call this for any feature that rewards the user.
CREATE OR REPLACE FUNCTION public.earn_coins(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_source_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET coins = coins + p_amount,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, source_id, note)
  VALUES (p_user_id, p_amount, p_type, p_source_id, p_note);
END;
$$;

-- ── spend_coins ───────────────────────────────────────────────────────────────
-- Deducts coins from a user atomically. Raises an error if the balance would
-- go below zero (profiles_coins_non_negative also enforces this at the DB
-- level as a second safety net).
CREATE OR REPLACE FUNCTION public.spend_coins(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_source_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  SELECT coins INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE; -- lock the row to prevent race conditions

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_coins: balance % < requested %', v_balance, p_amount;
  END IF;

  UPDATE public.profiles
  SET coins = coins - p_amount,
      updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, source_id, note)
  VALUES (p_user_id, p_amount, p_type, p_source_id, p_note);
END;
$$;
```

---

## Triggers

```sql
-- ── on_auth_user_created ──────────────────────────────────────────────────────
-- Fires when a new auth.users row is inserted. Creates the profile (which
-- sets coins = 100 via the DEFAULT) and immediately writes a signup_bonus
-- transaction so the ledger is complete from day one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, note)
  VALUES (NEW.id, 100, 'signup_bonus', 'Welcome to PomoPets!');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Health Data System

Three tables cover the full health tracking surface:

- `health_metric_types` — catalog of every trackable metric (system-defined + user-created custom)
- `health_readings` — individual data points for all single and multi-value metrics
- `workouts` — Apple Watch workout sessions (richer shape than a plain reading)

The `apple_health_identifier` column on `health_metric_types` maps each metric to its `HKQuantityTypeIdentifier` string so the future Apple Health / Watch sync layer knows exactly what to import. `external_id` on readings and workouts stores the Apple Health UUID and has a unique constraint to prevent duplicate imports.

```sql
-- ── health_metric_types ───────────────────────────────────────────────────────
-- Catalog of all trackable metrics. System rows (is_system = true, user_id = NULL)
-- are seeded below. User-created custom trackers set is_system = false and
-- carry the owner's user_id.
--
-- value_type:
--   'numeric'       – single decimal value  (e.g. heart rate, weight)
--   'integer'       – single whole number   (e.g. steps, stand hours)
--   'multi_numeric' – multiple named values (e.g. blood pressure)
--                     value_keys lists the field names: ['systolic','diastolic']
CREATE TABLE public.health_metric_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  unit text,
  value_type text NOT NULL DEFAULT 'numeric',
  value_keys text[],
  category text NOT NULL,
  apple_health_identifier text,
  is_system boolean NOT NULL DEFAULT true,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_metric_types_pkey PRIMARY KEY (id),
  CONSTRAINT health_metric_types_key_user_unique UNIQUE (key, user_id),
  CONSTRAINT health_metric_types_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT health_metric_types_value_type_check CHECK (
    value_type IN ('numeric', 'integer', 'multi_numeric')
  ),
  CONSTRAINT health_metric_types_category_check CHECK (
    category IN ('vitals', 'activity', 'sleep', 'body', 'custom')
  )
);

-- ── health_readings ───────────────────────────────────────────────────────────
-- One row per data point. Single-value metrics use value_numeric.
-- Multi-value metrics (e.g. blood pressure) use value_json:
--   { "systolic": 120, "diastolic": 80 }
-- external_id stores the Apple Health UUID; the unique constraint blocks
-- duplicate imports.
CREATE TABLE public.health_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  metric_type_id uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL,
  value_numeric numeric,
  value_json jsonb,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT health_readings_pkey PRIMARY KEY (id),
  CONSTRAINT health_readings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT health_readings_metric_type_id_fkey FOREIGN KEY (metric_type_id) REFERENCES public.health_metric_types(id),
  CONSTRAINT health_readings_source_check CHECK (
    source IN ('apple_watch', 'apple_health', 'manual', 'third_party')
  ),
  CONSTRAINT health_readings_external_id_unique UNIQUE (user_id, external_id)
);

-- ── workouts ──────────────────────────────────────────────────────────────────
-- Apple Watch workout sessions. Richer shape than a plain reading.
-- metadata jsonb catches any extra Apple Health fields without schema changes.
CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_type text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone NOT NULL,
  duration_seconds integer NOT NULL,
  active_calories numeric,
  total_calories numeric,
  distance_meters numeric,
  avg_heart_rate integer,
  max_heart_rate integer,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  notes text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workouts_pkey PRIMARY KEY (id),
  CONSTRAINT workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT workouts_source_check CHECK (
    source IN ('apple_watch', 'apple_health', 'manual')
  ),
  CONSTRAINT workouts_external_id_unique UNIQUE (user_id, external_id)
);
```

### System metric seed data

```sql
INSERT INTO public.health_metric_types
  (key, label, unit, value_type, value_keys, category, apple_health_identifier, is_system)
VALUES
  -- Vitals
  ('heart_rate',            'Heart Rate',             'bpm',        'integer',       NULL,                        'vitals',   'HKQuantityTypeIdentifierHeartRate',                  true),
  ('heart_rate_resting',    'Resting Heart Rate',     'bpm',        'integer',       NULL,                        'vitals',   'HKQuantityTypeIdentifierRestingHeartRate',           true),
  ('heart_rate_variability','Heart Rate Variability', 'ms',         'numeric',       NULL,                        'vitals',   'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',   true),
  ('blood_oxygen',          'Blood Oxygen',           '%',          'numeric',       NULL,                        'vitals',   'HKQuantityTypeIdentifierOxygenSaturation',           true),
  ('respiratory_rate',      'Respiratory Rate',       'breaths/min','numeric',       NULL,                        'vitals',   'HKQuantityTypeIdentifierRespiratoryRate',            true),
  ('blood_pressure',        'Blood Pressure',         'mmHg',       'multi_numeric', ARRAY['systolic','diastolic'],'vitals',  NULL,                                                 true),
  ('body_temperature',      'Body Temperature',       '°C',         'numeric',       NULL,                        'vitals',   'HKQuantityTypeIdentifierBodyTemperature',            true),
  -- Activity
  ('steps',                 'Steps',                  'steps',      'integer',       NULL,                        'activity', 'HKQuantityTypeIdentifierStepCount',                  true),
  ('active_calories',       'Active Calories',        'kcal',       'numeric',       NULL,                        'activity', 'HKQuantityTypeIdentifierActiveEnergyBurned',         true),
  ('exercise_minutes',      'Exercise Minutes',       'min',        'integer',       NULL,                        'activity', 'HKQuantityTypeIdentifierAppleExerciseTime',           true),
  ('stand_hours',           'Stand Hours',            'hrs',        'integer',       NULL,                        'activity', 'HKQuantityTypeIdentifierAppleStandTime',             true),
  ('vo2_max',               'VO2 Max',                'ml/kg/min',  'numeric',       NULL,                        'activity', 'HKQuantityTypeIdentifierVO2Max',                     true),
  -- Sleep
  ('sleep_duration',        'Sleep Duration',         'min',        'integer',       NULL,                        'sleep',    'HKCategoryTypeIdentifierSleepAnalysis',              true),
  -- Body
  ('weight',                'Weight',                 'kg',         'numeric',       NULL,                        'body',     'HKQuantityTypeIdentifierBodyMass',                   true),
  ('blood_glucose',         'Blood Glucose',          'mg/dL',      'numeric',       NULL,                        'body',     'HKQuantityTypeIdentifierBloodGlucose',               true),
  ('water_intake',          'Water Intake',           'mL',         'integer',       NULL,                        'body',     'HKQuantityTypeIdentifierDietaryWater',               true);
```

---

## Edge Cases & Notes

| Scenario | Handling |
|---|---|
| User tries to spend more coins than they have | `spend_coins` raises `insufficient_coins` before the UPDATE; `profiles_coins_non_negative` CHECK is a DB-level backstop |
| Two spend operations fire simultaneously | `FOR UPDATE` row lock in `spend_coins` serializes concurrent transactions |
| Feature grants coins then fails (e.g. network error after `earn_coins`) | Wrap the feature action and `earn_coins` call in the same Supabase RPC so both succeed or both roll back |
| Deleting a habit log that previously awarded coins | Do **not** auto-reverse coins — insert a negative-flavoured `manual_adjustment` or a dedicated `habit_log_reversed` type if reversal is allowed; never delete transaction rows |
| Admin correction | Use `earn_coins` or `spend_coins` with `transaction_type = 'manual_adjustment'` and a descriptive `note` |
| New transaction types added in future | Add to the `coin_transactions_type_check` constraint and document here |

### Health system

| Scenario | Handling |
|---|---|
| Apple Health import fires twice for the same reading | `external_id` + `UNIQUE (user_id, external_id)` silently blocks the duplicate on conflict |
| User manually logs a metric that Apple Health also syncs | Two separate rows — `source` distinguishes them; the app should deduplicate by `recorded_at` window if needed |
| User wants to track blood pressure (not on Watch natively) | Insert a `health_readings` row with `source = 'manual'` and `value_json = {"systolic": 120, "diastolic": 80}` |
| User creates a custom tracker (e.g. mood score) | Insert into `health_metric_types` with `is_system = false`, `user_id` set, `category = 'custom'` |
| Custom tracker deleted by user | Soft-delete pattern recommended — add `deleted_at` column rather than hard-deleting, so existing readings keep their FK reference |
| Apple Watch workout already exists | `external_id` unique constraint on `workouts` prevents duplicate; use `INSERT ... ON CONFLICT DO NOTHING` from the sync layer |
| New Apple Health metric type added in future | Insert a new row into `health_metric_types` with `is_system = true`; no schema change required |
| Units differ between Apple Health and manual entry | Store in a canonical unit (kg, mL, °C, etc.) and convert in the app layer before inserting |

---

## Pet Collection System

Two tables handle the pet layer:

- `pet_catalog` — master list of all pets that exist in the game, both always-available and limited/retired
- `user_pets` — each pet instance a user owns, with its individual live stats

`availability` drives shop visibility: `standard` pets are always purchasable, `limited` pets check `available_from`/`available_until`, and `retired` pets can no longer be bought but existing ownership is preserved. A partial unique index enforces that only one pet per user can be `is_selected = true` at a time.

```sql
-- ── pet_catalog ───────────────────────────────────────────────────────────────
-- Master list of every pet in the game. is_active + availability together
-- control whether a pet shows in the shop.
--
-- availability:
--   'standard' – always purchasable while is_active = true
--   'limited'  – purchasable only between available_from and available_until
--   'retired'  – no longer purchasable; existing user_pets rows are unaffected
--
-- asset_key maps to the pet's image/animation asset in the app bundle.
-- base_hunger / base_happiness / base_energy are the stat values
-- a newly acquired pet starts with.
CREATE TABLE public.pet_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  species text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  coin_cost integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'standard',
  available_from timestamp with time zone,
  available_until timestamp with time zone,
  asset_key text NOT NULL,
  base_hunger integer NOT NULL DEFAULT 100,
  base_happiness integer NOT NULL DEFAULT 100,
  base_energy integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pet_catalog_pkey PRIMARY KEY (id),
  CONSTRAINT pet_catalog_coin_cost_non_negative CHECK (coin_cost >= 0),
  CONSTRAINT pet_catalog_rarity_check CHECK (
    rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')
  ),
  CONSTRAINT pet_catalog_availability_check CHECK (
    availability IN ('standard', 'limited', 'retired')
  ),
  CONSTRAINT pet_catalog_base_stats_check CHECK (
    base_hunger BETWEEN 0 AND 100 AND
    base_happiness BETWEEN 0 AND 100 AND
    base_energy BETWEEN 0 AND 100
  )
);

-- ── user_pets ─────────────────────────────────────────────────────────────────
-- One row per pet instance owned by a user. Stats are live values that the
-- app updates over time (hunger decays, XP accumulates, etc.).
-- is_selected = true marks the currently displayed/active pet.
-- The partial unique index below ensures only one pet per user can be selected.
CREATE TABLE public.user_pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  catalog_pet_id uuid NOT NULL,
  nickname text,
  is_selected boolean NOT NULL DEFAULT false,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  hunger integer NOT NULL DEFAULT 100,
  happiness integer NOT NULL DEFAULT 100,
  energy integer NOT NULL DEFAULT 100,
  last_fed_at timestamp with time zone,
  last_played_at timestamp with time zone,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_pets_pkey PRIMARY KEY (id),
  CONSTRAINT user_pets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_pets_catalog_pet_id_fkey FOREIGN KEY (catalog_pet_id) REFERENCES public.pet_catalog(id),
  CONSTRAINT user_pets_level_positive CHECK (level >= 1),
  CONSTRAINT user_pets_xp_non_negative CHECK (xp >= 0),
  CONSTRAINT user_pets_hunger_check CHECK (hunger BETWEEN 0 AND 100),
  CONSTRAINT user_pets_happiness_check CHECK (happiness BETWEEN 0 AND 100),
  CONSTRAINT user_pets_energy_check CHECK (energy BETWEEN 0 AND 100)
);

-- Only one selected pet per user at a time.
CREATE UNIQUE INDEX user_pets_one_selected_per_user
  ON public.user_pets (user_id)
  WHERE is_selected = true;
```

### Edge cases

| Scenario | Handling |
|---|---|
| User tries to buy a limited pet outside its window | App checks `available_from`/`available_until` before calling `spend_coins`; `availability = 'limited'` is the signal |
| Limited pet window expires mid-session | App re-validates availability on purchase confirmation, not just on page load |
| Retiring a pet that users already own | Set `is_active = false` and `availability = 'retired'` on `pet_catalog`; existing `user_pets` rows are untouched |
| User selects a new active pet | Update old selected row to `is_selected = false`, then new row to `is_selected = true` in a single transaction — the partial unique index enforces only one can be true |
| User has no selected pet (all set to false) | Valid state — app falls back to prompting pet selection |
| Coin deduction and pet row creation must both succeed | Wrap `spend_coins` + `INSERT INTO user_pets` in an RPC so they roll back together on failure |
| Should a user be able to own duplicate pets? | No DB constraint prevents it; if you want to restrict it add `UNIQUE (user_id, catalog_pet_id)` to `user_pets` |
| Pet stats decay over time (hunger drops while app is closed) | Compute decay client-side from `last_fed_at`/`updated_at` on read rather than running a background job; write the result back on next app open |
