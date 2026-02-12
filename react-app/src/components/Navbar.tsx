import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    navigate('/');
    signOut();
  };

  return (
    <nav className="navigation">
      <ul>
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/shop">Shop</NavLink></li>
        <li><NavLink to="/study">Study</NavLink></li>
        <li><NavLink to="/pets">Pets</NavLink></li>
        <li><NavLink to="/games">Games</NavLink></li>
        <li><NavLink to="/help">Contact</NavLink></li>
        {user ? (
          <li className="nav-user" ref={dropdownRef}>
            <button
              className="nav-pfp-button"
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-label="Account menu"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="nav-pfp-img" />
              ) : (
                <span className="nav-pfp-placeholder">
                  {(profile?.display_name?.[0] || '?').toUpperCase()}
                </span>
              )}
            </button>
            {dropdownOpen && (
              <div className="account-dropdown glass-card">
                <p className="dropdown-name">{profile?.display_name || 'User'}</p>
                <Link
                  to="/settings"
                  className="dropdown-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>
                <button className="btn-logout" onClick={handleSignOut}>
                  Logout
                </button>
              </div>
            )}
          </li>
        ) : (
          <li><NavLink to="/login">Login</NavLink></li>
        )}
      </ul>
    </nav>
  );
}
