import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './HomePage.css';

interface ActivePet {
  id: string;
  nickname: string | null;
  level: number;
  hunger: number;
  happiness: number;
  energy: number;
  catalog_pet: {
    name: string;
    species: string;
    asset_key: string;
  };
}

const FEATURE_TILES = [
  { to: '/shop',   icon: 'fa-store',      label: 'Buy',     color: '#c084a0' },
  { to: '/health', icon: 'fa-heart-pulse', label: 'Health',  color: '#e07a7a' },
  { to: '/habits', icon: 'fa-list-check',  label: 'Habits',  color: '#7a9ee0' },
  { to: '/settings', icon: 'fa-gear',     label: 'Profile', color: '#8ab87a' },
];

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct > 60 ? '#7abd7a' : pct > 30 ? '#e0b87a' : '#e07a7a';
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-track">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stat-value">{pct}</span>
    </div>
  );
}

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const [activePet, setActivePet] = useState<ActivePet | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_pets')
      .select('id, nickname, level, hunger, happiness, energy, catalog_pet:catalog_pet_id(name, species, asset_key)')
      .eq('user_id', user.id)
      .eq('is_selected', true)
      .maybeSingle()
      .then(({ data }) => setActivePet((data as ActivePet) ?? null));
  }, [user]);

  if (loading) return null;

  // ── Not logged in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="landing">
        <h1>PomoPets</h1>
        <p>An interactive study pet game!</p>
        <div className="mascot-row" aria-hidden="true">
          <img src="/bunny.png" alt="" className="mascot-image" />
          <img src="/turtle.png" alt="" className="mascot-image" />
        </div>
        <Link to="/login" className="landing-btn">Get Started</Link>
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────────────
  const petName = activePet?.nickname ?? activePet?.catalog_pet?.name ?? null;

  return (
    <div className="home-page">

      {/* Greeting */}
      <h1 className="home-greeting">
        Hey, {profile?.display_name || 'Trainer'}!
      </h1>

      {/* Pet House */}
      <section className="pet-house">
        <div className="pet-house-header">
          <i className="fas fa-house" />
          <span>Your House</span>
        </div>

        {activePet === undefined && (
          <div className="pet-house-loading">
            <i className="fas fa-paw pet-house-icon spinning" />
          </div>
        )}

        {activePet === null && (
          <div className="pet-house-empty">
            <i className="fas fa-paw pet-house-icon muted" />
            <p>Your house is empty!</p>
            <Link to="/shop" className="pet-house-cta">Get a Pet</Link>
          </div>
        )}

        {activePet && (
          <div className="pet-house-active">
            <div className="pet-display">
              <i className="fas fa-paw pet-house-icon" />
              <div className="pet-identity">
                <span className="pet-name">{petName}</span>
                <span className="pet-level">Lv. {activePet.level} · {activePet.catalog_pet.species}</span>
              </div>
            </div>
            <div className="pet-stats">
              <StatBar label="Hunger"    value={activePet.hunger} />
              <StatBar label="Happiness" value={activePet.happiness} />
              <StatBar label="Energy"    value={activePet.energy} />
            </div>
            <Link to="/pets" className="pet-house-manage">Manage Pets</Link>
          </div>
        )}
      </section>

      {/* Feature Tiles */}
      <section className="feature-grid">
        {FEATURE_TILES.map(({ to, icon, label, color }) => (
          <Link key={to} to={to} className="feature-tile">
            <div className="feature-tile-icon" style={{ color }}>
              <i className={`fas ${icon}`} />
            </div>
            <span className="feature-tile-label">{label}</span>
          </Link>
        ))}
      </section>

    </div>
  );
}
