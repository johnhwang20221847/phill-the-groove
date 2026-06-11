import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import PostCard from '../components/PostCard'
import NewPostModal from '../components/NewPostModal'

async function fetchPosts(userId = null) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, total_score),
      reactions (color, user_id, score_value)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return data.map(post => {
    const counts = {}
    post.reactions?.forEach(r => {
      counts[r.color] = (counts[r.color] || 0) + 1
    })
    const userReaction = userId
      ? post.reactions?.find(r => r.user_id === userId)?.color || null
      : null
    return { ...post, reaction_counts: counts, user_reaction: userReaction }
  })
}

async function fetchVibeOfDay(userId = null) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, total_score),
      reactions (color, user_id, score_value)
    `)
    .gte('created_at', today.toISOString())

  if (error) return null

  if (!data || data.length === 0) return null

  // Sort by red reaction count
  const sorted = data
    .map(post => {
      const counts = {}
      post.reactions?.forEach(r => { counts[r.color] = (counts[r.color] || 0) + 1 })
      const userReaction = userId
        ? post.reactions?.find(r => r.user_id === userId)?.color || null
        : null
      return { ...post, reaction_counts: counts, user_reaction: userReaction, redCount: counts['red'] || 0 }
    })
    .filter(p => p.redCount > 0)
    .sort((a, b) => b.redCount - a.redCount)

  return sorted[0] || null
}

export default function Home({ onAuthRequired }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [vibeOfDay, setVibeOfDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, v] = await Promise.all([
        fetchPosts(user?.id),
        fetchVibeOfDay(user?.id)
      ])
      setPosts(p)
      setVibeOfDay(v)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Vibe of the Day */}
      {vibeOfDay && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs tracking-widest uppercase text-groove-red">🔴 Today's Vibe</span>
            <div className="flex-1 h-px bg-groove-dust/50" />
          </div>
          <div className="bg-groove-vinyl rounded-lg p-4 flex gap-4 items-center shadow-lg">
            <div className="shrink-0 w-16 h-16 rounded-full bg-groove-brown flex items-center justify-center shadow-inner animate-spin-slow">
              {vibeOfDay.cover_url ? (
                <img src={vibeOfDay.cover_url} alt="" className="w-full h-full rounded-full object-cover opacity-80" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-groove-label flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-groove-vinyl" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] text-groove-dust uppercase tracking-widest mb-0.5">Most 🔴 today</p>
              <h2 className="font-display font-black text-groove-cream text-xl leading-tight truncate">{vibeOfDay.song_title}</h2>
              <p className="font-mono text-xs text-groove-dust mt-0.5">{vibeOfDay.artist}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-2xl text-groove-red font-bold">🔴×{vibeOfDay.redCount}</p>
              <p className="font-mono text-[10px] text-groove-dust mt-0.5">heart-stoppers</p>
            </div>
          </div>
        </section>
      )}

      {/* Feed header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tracking-widest uppercase text-groove-label">Latest Picks</span>
          <div className="w-16 h-px bg-groove-dust/50" />
        </div>
        <button
          onClick={() => user ? setShowNewPost(true) : onAuthRequired()}
          className="flex items-center gap-1.5 bg-groove-red text-groove-cream font-mono text-xs tracking-widest uppercase px-3 py-2 rounded hover:bg-groove-brown transition-colors"
        >
          <span>+</span> Drop a Pick
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-groove-paper rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-groove-vinyl mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-groove-label flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-groove-vinyl" />
            </div>
          </div>
          <p className="font-display font-bold text-groove-vinyl text-xl mb-2">Nothing's spinning yet.</p>
          <p className="font-mono text-xs text-groove-label">Be the first to drop a pick.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onAuthRequired={onAuthRequired}
              onReacted={load}
            />
          ))}
        </div>
      )}

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onCreated={load} />
      )}
    </div>
  )
}
