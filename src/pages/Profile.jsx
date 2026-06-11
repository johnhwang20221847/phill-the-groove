import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRank, getNextRank, REACTIONS } from '../lib/ranks'
import PostCard from '../components/PostCard'

export default function Profile({ onAuthRequired }) {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: prof }, { data: postsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('posts')
          .select(`*, profiles:user_id (id, username, total_score), reactions (color, user_id, score_value)`)
          .eq('user_id', id)
          .order('created_at', { ascending: false })
      ])
      setProfile(prof)
      setPosts((postsData || []).map(post => {
        const counts = {}
        post.reactions?.forEach(r => { counts[r.color] = (counts[r.color] || 0) + 1 })
        return { ...post, reaction_counts: counts, user_reaction: null }
      }))
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-32 bg-groove-paper rounded-lg animate-pulse mb-4" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="font-display font-bold text-groove-vinyl text-xl">User not found.</p>
      </div>
    )
  }

  const rank = getRank(profile.total_score)
  const nextRank = getNextRank(profile.total_score)
  const progressToNext = nextRank
    ? Math.min(100, ((profile.total_score - rank.min) / (nextRank.min - rank.min)) * 100)
    : 100

  // Total reactions received across all posts
  const reactionTotals = {}
  posts.forEach(p => {
    Object.entries(p.reaction_counts || {}).forEach(([k, v]) => {
      reactionTotals[k] = (reactionTotals[k] || 0) + v
    })
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile card */}
      <div className="bg-groove-cream border border-groove-dust/60 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-display font-black text-2xl shrink-0">
            {profile.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-groove-vinyl text-2xl">{profile.username}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{rank.icon}</span>
              <span className="font-mono text-xs text-groove-label">{rank.label}</span>
              {profile.streak > 2 && (
                <span className="font-mono text-xs text-groove-amber">🔥 {profile.streak}-day streak</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-groove-vinyl text-3xl">{profile.total_score.toLocaleString()}</p>
            <p className="font-mono text-[10px] text-groove-dust uppercase tracking-wide">total pts</p>
          </div>
        </div>

        {/* Rank progress */}
        {nextRank && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-groove-label">Progress to {nextRank.icon} {nextRank.label}</span>
              <span className="font-mono text-[10px] text-groove-label">{nextRank.min - profile.total_score} pts to go</span>
            </div>
            <div className="h-1.5 bg-groove-paper rounded-full overflow-hidden">
              <div
                className="h-full bg-groove-red rounded-full transition-all"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>
        )}

        {/* Reaction summary */}
        {Object.keys(reactionTotals).length > 0 && (
          <div className="mt-4 pt-4 border-t border-groove-dust/50">
            <p className="font-mono text-[10px] uppercase tracking-widest text-groove-label mb-2">Reactions received</p>
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map(r => (
                reactionTotals[r.key] > 0 && (
                  <div key={r.key} className="flex items-center gap-1 bg-groove-paper border border-groove-dust rounded-full px-2.5 py-1">
                    <span className="text-sm">{r.emoji}</span>
                    <span className="font-mono text-xs text-groove-label">{reactionTotals[r.key]}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs tracking-widest uppercase text-groove-label">
          {posts.length} Pick{posts.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 h-px bg-groove-dust/50" />
      </div>

      {posts.length === 0 ? (
        <p className="font-mono text-xs text-groove-dust text-center py-8">No picks yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      )}
    </div>
  )
}
