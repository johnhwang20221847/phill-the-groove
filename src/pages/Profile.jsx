import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore'
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
      const profSnap = await getDoc(doc(db, 'profiles', id))
      if (profSnap.exists()) setProfile({ id: profSnap.id, ...profSnap.data() })

      const postsSnap = await getDocs(collection(db, 'posts'))
      const myPosts = []
      for (const d of postsSnap.docs) {
        const post = { id: d.id, ...d.data() }
        if (post.user_id !== id) continue
        const rSnap = await getDocs(collection(db, 'posts', d.id, 'reactions'))
        const counts = {}
        rSnap.forEach(r => { const data = r.data(); counts[data.color] = (counts[data.color] || 0) + 1 })
        myPosts.push({ ...post, reaction_counts: counts, user_reaction: null })
      }
      myPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setPosts(myPosts)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="h-32 bg-groove-paper rounded-lg animate-pulse mb-4" /></div>
  if (!profile) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="font-display font-bold text-groove-vinyl text-xl">User not found.</p></div>

  const rank = getRank(profile.total_score || 0)
  const nextRank = getNextRank(profile.total_score || 0)
  const progressToNext = nextRank ? Math.min(100, ((profile.total_score - rank.min) / (nextRank.min - rank.min)) * 100) : 100

  const reactionTotals = {}
  posts.forEach(p => Object.entries(p.reaction_counts || {}).forEach(([k, v]) => { reactionTotals[k] = (reactionTotals[k] || 0) + v }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
              {profile.streak > 2 && <span className="font-mono text-xs text-groove-amber">🔥 {profile.streak}-day streak</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-groove-vinyl text-3xl">{(profile.total_score || 0).toLocaleString()}</p>
            <p className="font-mono text-[10px] text-groove-dust uppercase tracking-wide">total pts</p>
          </div>
        </div>
        {nextRank && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-groove-label">Progress to {nextRank.icon} {nextRank.label}</span>
              <span className="font-mono text-[10px] text-groove-label">{nextRank.min - profile.total_score} pts to go</span>
            </div>
            <div className="h-1.5 bg-groove-paper rounded-full overflow-hidden">
              <div className="h-full bg-groove-red rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
            </div>
          </div>
        )}
        {Object.keys(reactionTotals).length > 0 && (
          <div className="mt-4 pt-4 border-t border-groove-dust/50">
            <p className="font-mono text-[10px] uppercase tracking-widest text-groove-label mb-2">Reactions received</p>
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map(r => reactionTotals[r.key] > 0 && (
                <div key={r.key} className="flex items-center gap-1 bg-groove-paper border border-groove-dust rounded-full px-2.5 py-1">
                  <span className="text-sm">{r.emoji}</span>
                  <span className="font-mono text-xs text-groove-label">{reactionTotals[r.key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs tracking-widest uppercase text-groove-label">{posts.length} Pick{posts.length !== 1 ? 's' : ''}</span>
        <div className="flex-1 h-px bg-groove-dust/50" />
      </div>
      {posts.length === 0 ? (
        <p className="font-mono text-xs text-groove-dust text-center py-8">No picks yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map(post => <PostCard key={post.id} post={post} onAuthRequired={onAuthRequired} />)}
        </div>
      )}
    </div>
  )
}
