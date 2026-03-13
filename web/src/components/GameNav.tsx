import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './GameNav.css'

export default function GameNav() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <nav className="game-nav">
      <Link to="/home" className="game-nav-logo">
        <img src="/logo.png" alt="PomoPets" className="game-nav-logo-img" />
        <span>PomoPets</span>
      </Link>

      <ul className="game-nav-links">
        <li><NavLink to="/home">Home</NavLink></li>
        <li><NavLink to="/shop">Shop</NavLink></li>
        <li><NavLink to="/health">Health</NavLink></li>
        <li><NavLink to="/habits">Habits</NavLink></li>
        <li><NavLink to="/pomodoro">Study</NavLink></li>
      </ul>

      <div className="game-nav-right" ref={dropdownRef}>
        <span className="game-nav-coins">🪙 {profile?.coins ?? 0}</span>
        <button className="game-nav-avatar" onClick={() => setOpen(p => !p)}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="avatar" />
            : <span>{(profile?.display_name?.[0] || '?').toUpperCase()}</span>
          }
        </button>

        {open && (
          <div className="game-nav-dropdown">
            <p className="dropdown-name">{profile?.display_name || 'Trainer'}</p>
            <Link to="/settings" className="dropdown-link" onClick={() => setOpen(false)}>Settings</Link>
            <button className="dropdown-signout" onClick={handleSignOut}>Sign Out</button>
          </div>
        )}
      </div>
    </nav>
  )
}
