import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { REACTIONS } from '../lib/ranks'
import { formatDistanceToNow } from 'date-fns'
import PostCard from '../components/PostCard'

export default function Archive({ onAuthRequired }) {
  const { user } = useAuth()
  const [tab, setTab] = useState('recommended')
  const [myPosts, setMyPosts] = useState([])
  const [reactedPosts, setReactedPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadArchive()
  }, [user])

  async function loadArchive() {
    setLoading(true)
    try {
      const postsSnap = await getDocs(collection(db, 'posts'))
      const mine = [], reacted = []

      for (const d of postsSnap.docs) {
        const post = { id: d.id, ...d.data() }
        const rSnap = await getDocs(collection(db, 'posts', d.id, 'reactions'))
        const counts = {}
        let myReaction = null
        let myReactedAt = null
        rSnap.forEach(r => {
          const data = r.data()
          counts[data.color] = (counts[data.color] || 0) + 1
          if (r.id === user.uid) { myReaction = data.color; myReactedAt = data.created_at }
        })
        const enriched = { ...post, reaction_counts: counts, user_reaction: myReaction }
        if (post.user_id === user.uid) mine.push(enriched)
        if (myReaction && post.user_id !== user.uid) reacted.push({ ...enriched, my_reaction: myReaction, reacted_at: myReactedAt })
      }

      mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      reacted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setMyPosts(mine)
      setReactedPosts(reacted)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="font-display font-black text-groove-vinyl text-3xl mb-3">My Archive</h1>
      <p className="font-mono text-xs text-groove-label mb-6">Sign in to see your history.</p>
      <button onClick={onAuthRequired} className="bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase px-6 py-3 rounded hover:bg-groove-brown transition-colors">Sign In</button>
    </div>
  )

  const tabs = [
    { key: 'recommended', label: `My Picks (${myPosts.length})` },
    { key: 'reacted', label: `Reacted To (${reactedPosts.length})` },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase text-groove-label mb-1">Your history</p>
        <h1 className="font-display font-black text-groove-vinyl text-3xl italic">My Archive</h1>
      </div>
      <div className="flex gap-1 mb-6 bg-groove-paper rounded-lg p-1 border border-groove-dust/50">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 font-mono text-xs tracking-wider uppercase py-2 rounded transition-all ${tab === t.key ? 'bg-groove-vinyl text-groove-cream shadow-sm' : 'text-groove-label hover:text-groove-brown'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-groove-paper rounded-lg animate-pulse" />)}</div>
      ) : tab === 'recommended' ? (
        myPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display font-bold text-groove-vinyl text-xl">You haven't dropped any picks yet.</p>
          </div>
        ) : (
          <div>
            <div className="bg-groove-cream border border-groove-dust/50 rounded-lg p-4 mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-groove-label mb-3">All-time reactions on your picks</p>
              <div className="flex flex-wrap gap-3">
                {REACTIONS.map(r => {
                  const total = myPosts.reduce((sum, p) => sum + (p.reaction_counts?.[r.key] || 0), 0)
                  return <div key={r.key} className="flex items-center gap-1.5"><span className="text-lg">{r.emoji}</span><span className="font-mono text-sm text-groove-vinyl font-medium">{total}</span></div>
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {myPosts.map(post => <PostCard key={post.id} post={post} onAuthRequired={onAuthRequired} />)}
            </div>
          </div>
        )
      ) : (
        reactedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display font-bold text-groove-vinyl text-xl">No reactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reactedPosts.map(post => {
              const myR = REACTIONS.find(r => r.key === post.my_reaction)
              return (
                <div key={post.id} className="relative">
                  {myR && <div className="absolute -top-2 -right-2 z-10 bg-groove-vinyl text-groove-cream rounded-full w-8 h-8 flex items-center justify-center text-sm shadow border-2 border-groove-cream">{myR.emoji}</div>}
                  <PostCard post={post} onAuthRequired={onAuthRequired} />
                  {post.reacted_at && <p className="font-mono text-[10px] text-groove-dust mt-1 text-right px-1">You reacted {formatDistanceToNow(new Date(post.reacted_at), { addSuffix: true })}</p>}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
