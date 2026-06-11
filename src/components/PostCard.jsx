import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore'
import { REACTIONS, getRank } from '../lib/ranks'

export default function PostCard({ post, onAuthRequired }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState(post.user_reaction || null)
  const [counts, setCounts] = useState(post.reaction_counts || {})
  const [loading, setLoading] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)

  const rank = getRank(post.author_score || 0)
  const coverUrl = post.cover_url || null
  const authorName = post.author_name || '?'

  function getSpotifyId(url) {
    if (!url) return null
    const match = url.match(/track\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  async function handleReaction(key) {
    if (!user) { onAuthRequired(); return }
    if (loading) return
    setLoading(true)

    const reactionRef = doc(db, 'posts', post.id, 'reactions', user.uid)
    const authorRef = doc(db, 'profiles', post.user_id)
    const reaction = REACTIONS.find(r => r.key === key)

    try {
      if (userReaction === key) {
        const old = REACTIONS.find(r => r.key === userReaction)
        await deleteDoc(reactionRef)
        if (old.score !== 0) await updateDoc(authorRef, { total_score: increment(-old.score) })
        setCounts(c => ({ ...c, [key]: Math.max(0, (c[key] || 0) - 1) }))
        setUserReaction(null)
      } else {
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

  const spotifyId = getSpotifyId(post.spotify_url)

  return (
    <article className="bg-groove-cream border border-groove-dust/60 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-1 bg-gradient-to-r from-groove-vinyl via-groove-red to-groove-amber" />
      <div className="p-4">
        {/* Song info */}
        <div className="flex gap-3 mb-3">
          <div className="shrink-0 w-14 h-14 rounded-full bg-groove-vinyl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform duration-500">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full rounded-full object-cover opacity-80" />
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
              {spotifyId && (
                <button
                  onClick={() => setShowPlayer(p => !p)}
                  className="flex items-center gap-1 font-mono text-[10px] bg-[#1DB954]/10 border border-[#1DB954]/40 px-1.5 py-0.5 rounded text-[#1DB954] hover:bg-[#1DB954]/20 transition-colors"
                >
                  <span>{showPlayer ? '▼' : '▶'}</span>
                  <span>{showPlayer ? 'Hide' : 'Play'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Spotify Player */}
        {spotifyId && showPlayer && (
          <iframe
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg mb-3"
          />
        )}

        {post.note && (
          <p className="font-body text-sm text-groove-brown italic leading-relaxed mb-3 pl-1 border-l-2 border-groove-dust">"{post.note}"</p>
        )}

        {/* Reactions - Star Rating */}
        <div className="flex items-center gap-1 mb-3">
          {REACTIONS.slice().reverse().map((r, i) => {
            const isHighlighted = userReaction
              ? REACTIONS.slice().reverse().findIndex(x => x.key === userReaction) >= i
              : false

            return (
              <button
                key={r.key}
                onClick={() => handleReaction(r.key)}
                title={`${i + 1}점 - ${r.label}`}
                className="transition-transform hover:scale-125 active:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-7 h-7 drop-shadow-sm"
                  fill={isHighlighted ? '#C0A020' : 'none'}
                  stroke={isHighlighted ? '#C0A020' : '#BBBBBB'}
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.499Z"
                  />
                </svg>
              </button>
            )
          })}

          {userReaction && (() => {
            const selected = REACTIONS.find(r => r.key === userReaction)
            const count = counts[userReaction]
            return (
              <span className="font-mono text-xs text-groove-label ml-1">
                {selected.label}{count > 0 ? ` (${count})` : ''}
              </span>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Link to={`/profile/${post.user_id}`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <div className="w-5 h-5 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-mono text-[9px] font-bold">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <span className="font-mono text-xs text-groove-label">{rank.icon} {authorName}</span>
          </Link>
          <span className="font-mono text-[10px] text-groove-dust">
            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
          </span>
        </div>
      </div>
    </article>
  )
}
