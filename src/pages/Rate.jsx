import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, query, getDocs, doc, setDoc, updateDoc, increment, where } from 'firebase/firestore'
import { useAuth } from '../lib/AuthContext'
import { REACTIONS } from '../lib/ranks'

export default function Rate({ onAuthRequired }) {
  const { user, profile } = useAuth()
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reacting, setReacting] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  useEffect(() => {
    if (user) loadQueue()
    else setLoading(false)
  }, [user])

  async function loadQueue() {
    setLoading(true)
    try {
      const postsSnap = await getDocs(collection(db, 'posts'))
      const allPosts = postsSnap.docs.map(d => ({ id: d.id, cover_url: null, genre: null, year: null, note: null, ...d.data() }))

      // Filter out own posts and already reacted
      const filtered = []
      for (const post of allPosts) {
        if (post.user_id === user.uid) continue
        const rSnap = await getDocs(collection(db, 'posts', post.id, 'reactions'))
        const alreadyReacted = rSnap.docs.some(r => r.id === user.uid)
        if (!alreadyReacted) filtered.push(post)
      }

      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setQueue(filtered.slice(0, 20))
      setCurrent(0)
      setDone(filtered.length === 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReaction(key) {
    if (!user) { onAuthRequired(); return }
    if (reacting) return
    setReacting(true)
    const post = queue[current]
    const reaction = REACTIONS.find(r => r.key === key)
    try {
      await setDoc(doc(db, 'posts', post.id, 'reactions', user.uid), {
        color: key, score_value: reaction.score, user_id: user.uid
      })
      if (reaction.score !== 0) {
        await updateDoc(doc(db, 'profiles', post.user_id), { total_score: increment(reaction.score) })
      }
      setSessionCount(c => c + 1)
      if (current + 1 >= queue.length) setDone(true)
      else setCurrent(c => c + 1)
    } catch (err) { console.error(err) }
    finally { setReacting(false) }
  }

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-groove-vinyl mx-auto mb-6 flex items-center justify-center"><span className="text-3xl">🎵</span></div>
      <h1 className="font-display font-black text-groove-vinyl text-3xl mb-3">Give Me Songs to Rate!</h1>
      <p className="font-mono text-xs text-groove-label mb-6">Sign in to start rating.</p>
      <button onClick={onAuthRequired} className="bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase px-6 py-3 rounded hover:bg-groove-brown transition-colors">Sign In to Rate</button>
    </div>
  )

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-groove-paper mx-auto mb-4 animate-pulse" />
      <p className="font-mono text-xs text-groove-label">Loading the queue...</p>
    </div>
  )

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-groove-vinyl mx-auto mb-6 flex items-center justify-center"><span className="text-3xl">✅</span></div>
      <h2 className="font-display font-black text-groove-vinyl text-2xl mb-2">All caught up!</h2>
      <p className="font-mono text-xs text-groove-label mb-2">You rated {sessionCount} song{sessionCount !== 1 ? 's' : ''} this session.</p>
      <p className="font-mono text-xs text-groove-dust mb-6">Check back later for new picks.</p>
      <button onClick={loadQueue} className="bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase px-6 py-3 rounded hover:bg-groove-brown transition-colors">Refresh Queue</button>
    </div>
  )

  const post = queue[current]
  const progress = (current / queue.length) * 100

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <p className="font-mono text-xs tracking-widest uppercase text-groove-red mb-1">Give Me Songs to Rate!</p>
        <h1 className="font-display font-black text-groove-vinyl text-3xl">What's your vibe?</h1>
        <p className="font-mono text-xs text-groove-label mt-1">{current + 1} of {queue.length} in queue</p>
      </div>
      <div className="h-1 bg-groove-paper rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-groove-vinyl to-groove-red transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <div className="bg-groove-cream border border-groove-dust/60 rounded-xl p-6 shadow-lg mb-6">
        <div className="flex flex-col items-center mb-5">
          <div className="w-28 h-28 rounded-full bg-groove-vinyl flex items-center justify-center shadow-2xl mb-4">
            {post.cover_url ? <img src={post.cover_url} alt="" className="w-full h-full rounded-full object-cover opacity-80" /> : (
              <div className="w-10 h-10 rounded-full bg-groove-label flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-groove-vinyl" /></div>
            )}
          </div>
          <h2 className="font-display font-black text-groove-vinyl text-2xl text-center">{post.song_title}</h2>
          <p className="font-mono text-sm text-groove-label mt-1">{post.artist}</p>
          <div className="flex gap-2 mt-2">
            {post.genre && <span className="font-mono text-[10px] bg-groove-paper border border-groove-dust px-2 py-0.5 rounded text-groove-label uppercase">{post.genre}</span>}
            {post.year && <span className="font-mono text-[10px] bg-groove-paper border border-groove-dust px-2 py-0.5 rounded text-groove-label">{post.year}</span>}
          </div>
        </div>
        {post.note && <p className="font-body text-sm text-groove-brown italic text-center border-t border-groove-dust/50 pt-4 leading-relaxed">"{post.note}"</p>}
        <p className="font-mono text-[10px] text-groove-dust text-center mt-3">— recommended by {post.author_name}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {REACTIONS.map(r => (
          <button key={r.key} onClick={() => handleReaction(r.key)} disabled={reacting} title={r.label}
            className="flex flex-col items-center gap-1 bg-groove-paper border border-groove-dust rounded-lg p-3 hover:border-groove-brown hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
            <span className="text-xl">{r.emoji}</span>
            <span className="font-mono text-[9px] text-groove-label text-center leading-tight">{r.label}</span>
          </button>
        ))}
      </div>
      <p className="font-mono text-[10px] text-groove-dust text-center mt-4">Your reactions earn the recommender points toward their rank.</p>
    </div>
  )
}
