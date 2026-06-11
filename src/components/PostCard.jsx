import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { REACTIONS, getRank } from '../lib/ranks'

export default function PostCard({ post, onAuthRequired }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState(post.user_reaction || null)
  const [counts, setCounts] = useState(post.reaction_counts || {})
  const [loading, setLoading] = useState(false)

  const rank = getRank(post.author_score || 0)

  async function handleReaction(key) {
    if (!user) { onAuthRequired(); return }
    if (loading) return
    setLoading(true)

    const reactionRef = doc(db, 'posts', post.id, 'reactions', user.uid)
    const authorRef = doc(db, 'profiles', post.user_id)
    const reaction = REACTIONS.find(r => r.key === key)

    try {
      if (userReaction === key) {
        // Remove reaction
        const old = REACTIONS.find(r => r.key === userReaction)
        await deleteDoc(reactionRef)
        if (old.score !== 0) await updateDoc(authorRef, { total_score: increment(-old.score) })
        setCounts(c => ({ ...c, [key]: Math.max(0, (c[key] || 0) - 1) }))
        setUserReaction(null)
      } else {
        // Replace or add reaction
        const oldReaction = userReaction ? REACTIONS.find(r => r.key === userReaction) : null
        await setDoc(reactionRef, { color: key, score_value: reaction.score, user_id: user.uid })
        const scoreDelta = reaction.score - (oldReaction?.score || 0)
        if (scoreDelta !== 0) await updateDoc(authorRef, { total_score: increment(scoreDelta) })

        setCounts(c => {
          const next = { ...c }
          if (userReaction) next[userReaction] = Math.max(0, (next[userReaction] || 0) - 1)
          next[key] = (next[key] || 0) + 1
          return next
        })
        setUserReaction(key)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="bg-groove-cream border border-groove-dust/60 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-1 bg-gradient-to-r from-groove-vinyl via-groove-red to-groove-amber" />
      <div className="p-4">
        {/* Song info */}
        <div className="flex gap-3 mb-3">
          <div className="shrink-0 w-14 h-14 rounded-full bg-groove-vinyl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-500">
            {post.cover_url ? (
              <img src={post.cover_url} alt="" className="w-full h-full rounded-full object-cover opacity-80" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-groove-label flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-groove-vinyl" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-groove-vinyl text-base leading-tight truncate">{post.song_title}</h3>
            <p className="font-mono text-xs text-groove-label mt-0.5 truncate">{post.artist}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {post.genre && <span className="font-mono text-[10px] bg-groove-paper border border-groove-dust px-1.5 py-0.5 rounded text-groove-label uppercase tracking-wide">{post.genre}</span>}
              {post.year && <span className="font-mono text-[10px] bg-groove-paper border border-groove-dust px-1.5 py-0.5 rounded text-groove-label">{post.year}</span>}
            </div>
          </div>
        </div>

        {post.note && (
          <p className="font-body text-sm text-groove-brown italic leading-relaxed mb-3 pl-1 border-l-2 border-groove-dust">"{post.note}"</p>
        )}

        {/* Reactions */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {REACTIONS.map(r => (
            <button
              key={r.key}
              onClick={() => handleReaction(r.key)}
              title={r.label}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-mono transition-all ${
                userReaction === r.key
                  ? 'bg-groove-vinyl border-groove-vinyl text-groove-cream scale-105'
                  : 'bg-groove-paper border-groove-dust text-groove-label hover:border-groove-brown hover:scale-105'
              }`}
            >
              <span>{r.emoji}</span>
              {counts[r.key] > 0 && <span>{counts[r.key]}</span>}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-mono text-[9px] font-bold">
              {post.author_name?.charAt(0).toUpperCase()}
            </div>
            <span className="font-mono text-xs text-groove-label">{rank.icon} {post.author_name}</span>
          </Link>
          <span className="font-mono text-[10px] text-groove-dust">
            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
          </span>
        </div>
      </div>
    </article>
  )
}
