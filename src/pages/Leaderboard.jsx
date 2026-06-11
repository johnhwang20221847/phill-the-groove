import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Leaderboard() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('charts') // 'charts' | 'curators'
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function load() {
      // ── 1. 음악 평점 순위 ──
      const postsSnap = await getDocs(collection(db, 'posts'))
      const songList = []
      for (const d of postsSnap.docs) {
        const post = { id: d.id, ...d.data() }
        const rSnap = await getDocs(collection(db, 'posts', d.id, 'reactions'))
        const scores = []
        rSnap.forEach(r => {
          const val = r.data().score_value
          if (typeof val === 'number') scores.push(val)
        })
        const avg = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        songList.push({ ...post, avg_score: avg, rating_count: scores.length })
      }
      // 평점 있는 것만, 평균 높은 순 → 평점 수 많은 순
      const ranked = songList
        .filter(s => s.avg_score !== null)
        .sort((a, b) => b.avg_score - a.avg_score || b.rating_count - a.rating_count)
      setSongs(ranked)

      // ── 2. 큐레이터 랭킹 (기존) ──
      const profilesSnap = await getDocs(collection(db, 'profiles'))
      const profileList = profilesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
        .slice(0, 50)
      setUsers(profileList)

      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  // 별점 렌더 (0~5)
  function Stars({ value }) {
    const filled = Math.round(value)
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(n => (
          <svg key={n} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            className="w-3 h-3"
            fill={n <= filled ? '#C0A020' : 'none'}
            stroke={n <= filled ? '#C0A020' : '#BBBBBB'}
            strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.499Z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <p className="font-mono text-xs tracking-widest uppercase text-groove-label mb-2">Community Rankings</p>
        <h1 className="font-display font-black text-groove-vinyl text-4xl italic">The Charts</h1>
        <div className="w-12 h-1 bg-groove-red mx-auto mt-3" />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-groove-paper rounded-lg p-1 border border-groove-dust/50">
        <button
          onClick={() => setTab('charts')}
          className={`flex-1 font-mono text-xs tracking-wider uppercase py-2 rounded transition-all ${
            tab === 'charts' ? 'bg-groove-vinyl text-groove-cream shadow-sm' : 'text-groove-label hover:text-groove-brown'
          }`}
        >
          🎵 Song Charts
        </button>
        <button
          onClick={() => setTab('curators')}
          className={`flex-1 font-mono text-xs tracking-wider uppercase py-2 rounded transition-all ${
            tab === 'curators' ? 'bg-groove-vinyl text-groove-cream shadow-sm' : 'text-groove-label hover:text-groove-brown'
          }`}
        >
          👑 Curators
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-groove-paper rounded-lg animate-pulse" />)}
        </div>

      ) : tab === 'charts' ? (
        // ── Song Charts ──
        songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display font-bold text-groove-vinyl text-xl">No ratings yet.</p>
            <p className="font-mono text-xs text-groove-label mt-2">Rate some songs to build the charts!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song, idx) => (
              <div key={song.id}
                className="flex items-center gap-3 bg-groove-cream border border-groove-dust/60 rounded-lg px-4 py-3 hover:shadow-md hover:border-groove-brown transition-all">
                {/* 순위 */}
                <div className="w-8 text-center shrink-0">
                  {idx < 3
                    ? <span className="text-lg">{medals[idx]}</span>
                    : <span className="font-mono text-xs text-groove-dust">{idx + 1}</span>}
                </div>

                {/* 앨범 커버 */}
                <div className="w-10 h-10 rounded-full bg-groove-vinyl flex items-center justify-center shrink-0 overflow-hidden">
                  {song.cover_url
                    ? <img src={song.cover_url} alt="" className="w-full h-full object-cover opacity-80" />
                    : <div className="w-3 h-3 rounded-full bg-groove-label flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-groove-vinyl" />
                      </div>
                  }
                </div>

                {/* 곡 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-groove-vinyl text-sm truncate">{song.song_title}</p>
                  <p className="font-mono text-[11px] text-groove-label truncate">{song.artist}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars value={song.avg_score} />
                    <span className="font-mono text-[10px] text-groove-dust">({song.rating_count}명)</span>
                  </div>
                </div>

                {/* 평균 점수 */}
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-groove-vinyl text-xl">
                    {song.avg_score.toFixed(1)}
                  </p>
                  <p className="font-mono text-[9px] text-groove-dust uppercase tracking-wide">avg</p>
                </div>
              </div>
            ))}
          </div>
        )

      ) : (
        // ── Curators ──
        users.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-display font-bold text-groove-vinyl text-xl">No curators yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u, idx) => (
              <div key={u.id}
                className="flex items-center gap-3 bg-groove-cream border border-groove-dust/60 rounded-lg px-4 py-3 hover:shadow-md hover:border-groove-brown transition-all">
                <div className="w-8 text-center shrink-0">
                  {idx < 3
                    ? <span className="text-lg">{medals[idx]}</span>
                    : <span className="font-mono text-xs text-groove-dust">{idx + 1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-groove-vinyl flex items-center justify-center text-groove-cream font-mono text-sm font-bold shrink-0">
                  {u.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm text-groove-vinyl font-medium truncate block">{u.username}</span>
                  {u.streak > 2 && <span className="font-mono text-[10px] text-groove-amber">🔥 {u.streak}d streak</span>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-groove-vinyl text-lg">{(u.total_score || 0).toLocaleString()}</p>
                  <p className="font-mono text-[9px] text-groove-dust uppercase tracking-wide">pts</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
