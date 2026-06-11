import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRank, RANKS } from '../lib/ranks'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, total_score, streak')
        .order('total_score', { ascending: false })
        .limit(50)
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-mono text-xs tracking-widest uppercase text-groove-label mb-2">Community Rankings</p>
        <h1 className="font-display font-black text-groove-vinyl text-4xl italic">The Charts</h1>
        <div className="w-12 h-1 bg-groove-red mx-auto mt-3" />
      </div>

      {/* Rank tiers legend */}
      <div className="grid grid-cols-5 gap-1 mb-8">
        {RANKS.map(r => (
          <div key={r.label} className="bg-groove-paper border border-groove-dust/50 rounded p-2 text-center">
            <div className="text-lg mb-1">{r.icon}</div>
            <p className="font-mono text-[9px] text-groove-label leading-tight">{r.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-groove-paper rounded-lg animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-display font-bold text-groove-vinyl text-xl">No curators yet.</p>
          <p className="font-mono text-xs text-groove-label mt-2">Be the first to start recommending.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u, idx) => {
            const rank = getRank(u.total_score)
            return (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                className="flex items-center gap-3 bg-groove-cream border border-groove-dust/60 rounded-lg px-4 py-3 hover:shadow-md hover:border-groove-brown transition-all group"
              >
                {/* Position */}
                <div className="w-8 text-center">
                  {idx < 3 ? (
                    <span className="text-lg">{medals[idx]}</span>
                  ) : (
                    <span className="font-mono text-xs text-groove-dust">{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-mono text-sm font-bold shrink-0">
                  {u.username?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm text-groove-vinyl font-medium truncate">{u.username}</span>
                    {u.streak > 2 && (
                      <span className="font-mono text-[10px] text-groove-amber">🔥{u.streak}d</span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-groove-label">{rank.icon} {rank.label}</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-groove-vinyl text-lg">{u.total_score.toLocaleString()}</p>
                  <p className="font-mono text-[9px] text-groove-dust uppercase tracking-wide">pts</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
