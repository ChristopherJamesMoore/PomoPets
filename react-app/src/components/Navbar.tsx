import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountDropdown from './AccountDropdown';
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

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
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
              <AccountDropdown
                onClose={() => setDropdownOpen(false)}
                onSignOut={handleSignOut}
              />
            )}
          </li>
        ) : (
          <li><NavLink to="/login">Login</NavLink></li>
        )}
      </ul>
    </nav>
  );
}
