import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getRank } from '../lib/ranks'

export default function Navbar({ onAuthOpen }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const rank = profile ? getRank(profile.total_score) : null

  async function handleSignOut() {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`font-mono text-xs tracking-widest uppercase transition-colors ${
        location.pathname === to
          ? 'text-groove-red'
          : 'text-groove-label hover:text-groove-brown'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-40 bg-groove-cream border-b border-groove-dust/50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-full bg-groove-vinyl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <div className="w-2 h-2 rounded-full bg-groove-cream" />
          </div>
          <span className="font-display font-black text-groove-vinyl text-lg leading-none">
            Phill<span className="text-groove-red italic"> the </span>Groove
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLink('/', 'Feed')}
          {navLink('/rate', 'Rate Songs')}
          {navLink('/leaderboard', 'Charts')}
          {user && navLink('/archive', 'My Archive')}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-mono text-xs font-bold">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block font-mono text-xs text-groove-label">
                  {rank?.icon} {profile.username}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 bg-groove-cream border border-groove-dust rounded shadow-lg w-44 py-1 z-50">
                  <Link
                    to={`/profile/${profile.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 font-mono text-xs text-groove-brown hover:bg-groove-paper transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/archive"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 font-mono text-xs text-groove-brown hover:bg-groove-paper transition-colors"
                  >
                    My Archive
                  </Link>
                  <hr className="my-1 border-groove-dust/50" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 font-mono text-xs text-groove-red hover:bg-groove-paper transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAuthOpen}
              className="font-mono text-xs tracking-widest uppercase bg-groove-vinyl text-groove-cream px-4 py-2 rounded hover:bg-groove-brown transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex gap-4 px-4 pb-2">
        {navLink('/', 'Feed')}
        {navLink('/rate', 'Rate')}
        {navLink('/leaderboard', 'Charts')}
        {user && navLink('/archive', 'Archive')}
      </div>
    </header>
  )
}
