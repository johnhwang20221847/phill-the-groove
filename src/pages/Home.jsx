import { useState, useEffect, useMemo } from 'react'
import { db } from '../lib/firebase'
import { collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../lib/AuthContext'
import PostCard from '../components/PostCard'
import NewPostModal from '../components/NewPostModal'

const SORT_OPTIONS = [
  { key: 'latest',  label: 'Latest (최신순)' },
  { key: 'title',   label: 'Title (제목) A-Z' },
  { key: 'artist',  label: 'Artist (아티스트) A-Z' },
  { key: 'genre',   label: 'Genre (장르) A-Z' },
]

export default function Home({ onAuthRequired }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [vibeOfDay, setVibeOfDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)

  // 필터/정렬 상태
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('latest')

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(100))
    const unsub = onSnapshot(q, async (snap) => {
      const postsData = await Promise.all(snap.docs.map(async (d) => {
        const post = { id: d.id, ...d.data() }
        const rSnap = await getDocs(collection(db, 'posts', d.id, 'reactions'))
        const counts = {}
        let userReaction = null
        rSnap.forEach(r => {
          const data = r.data()
          counts[data.color] = (counts[data.color] || 0) + 1
          if (user && r.id === user.uid) userReaction = data.color
        })
        return { ...post, reaction_counts: counts, user_reaction: userReaction }
      }))
      setPosts(postsData)

      const today = new Date(); today.setHours(0,0,0,0)
      const todayPosts = postsData.filter(p => p.created_at && new Date(p.created_at) >= today)
      const sorted = todayPosts.filter(p => (p.reaction_counts?.red || 0) > 0)
        .sort((a, b) => (b.reaction_counts?.red || 0) - (a.reaction_counts?.red || 0))
      setVibeOfDay(sorted[0] || null)
      setLoading(false)
    })
    return unsub
  }, [user?.uid])

  // 필터 + 정렬 적용
  const filteredPosts = useMemo(() => {
    let result = [...posts]

    // 검색 (제목, 아티스트)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p =>
        p.song_title?.toLowerCase().includes(q) ||
        p.artist?.toLowerCase().includes(q)
      )
    }

    // 정렬
    result.sort((a, b) => {
      if (sortKey === 'title')  return (a.song_title || '').localeCompare(b.song_title || '', ['ko', 'en'])
      if (sortKey === 'artist') return (a.artist || '').localeCompare(b.artist || '', ['ko', 'en'])
      if (sortKey === 'genre')  return (a.genre || '').localeCompare(b.genre || '', ['ko', 'en'])
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return result
  }, [posts, search, sortKey])

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
            <div className="shrink-0 w-16 h-16 rounded-full bg-groove-brown flex items-center justify-center shadow-inner">
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
              <p className="font-mono text-2xl text-groove-red font-bold">🔴×{vibeOfDay.reaction_counts?.red || 0}</p>
              <p className="font-mono text-[10px] text-groove-dust mt-0.5">heart-stoppers</p>
            </div>
          </div>
        </section>
      )}

      {/* Feed 헤더 */}
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

      {/* 검색 + 정렬 + 장르 필터 */}
      <div className="bg-groove-paper border border-groove-dust/40 rounded-lg p-3 mb-5 space-y-3">

        {/* 검색창 */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-groove-dust pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목 또는 아티스트 검색..."
            className="w-full bg-groove-cream border border-groove-dust/60 rounded pl-8 pr-3 py-2 font-mono text-xs text-groove-vinyl placeholder-groove-dust focus:outline-none focus:border-groove-brown"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-groove-dust hover:text-groove-brown font-mono text-xs">
              ✕
            </button>
          )}
        </div>

        {/* 정렬 옵션 */}
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`font-mono text-[10px] tracking-wider uppercase px-2.5 py-1 rounded transition-all ${
                sortKey === opt.key
                  ? 'bg-groove-vinyl text-groove-cream'
                  : 'bg-groove-cream border border-groove-dust text-groove-label hover:border-groove-brown'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 카운트 */}
      {search && !loading && (
        <p className="font-mono text-xs text-groove-label mb-3">
          {filteredPosts.length}개 결과 — "{search}"
        </p>
      )}

      {/* 피드 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-groove-paper rounded-lg animate-pulse" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-groove-vinyl mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-groove-label flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-groove-vinyl" />
            </div>
          </div>
          {posts.length === 0 ? (
            <>
              <p className="font-display font-bold text-groove-vinyl text-xl mb-2">Nothing's spinning yet.</p>
              <p className="font-mono text-xs text-groove-label">Be the first to drop a pick.</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-groove-vinyl text-xl mb-2">No results found.</p>
              <button onClick={() => setSearch('')}
                className="font-mono text-xs text-groove-red hover:underline mt-1">
                필터 초기화
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      )}

      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} />}
    </div>
  )
}
