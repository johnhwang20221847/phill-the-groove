import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore'
import { REACTIONS, getRank } from '../lib/ranks'
import NewPostModal from './NewPostModal'

// ── 공유 카드 생성 함수 ──
async function generateShareCard(post) {
  const canvas = document.createElement('canvas')
  const W = 600, H = 340
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 배경
  ctx.fillStyle = '#1A1410'
  ctx.fillRect(0, 0, W, H)

  // 상단 그라디언트 띠
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#1A1410')
  grad.addColorStop(0.4, '#3D2B1F')
  grad.addColorStop(1, '#C0392B')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 4)

  // 바이닐/앨범 커버 영역 (왼쪽)
  const imgSize = 220
  const imgX = 40
  const imgY = (H - imgSize) / 2

  if (post.cover_url) {
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.crossOrigin = 'anonymous'
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = post.cover_url
      })
      // 원형 클리핑
      ctx.save()
      ctx.beginPath()
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
      ctx.restore()

      // 바이닐 오버레이 링
      ctx.save()
      ctx.beginPath()
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()

      // 중앙 홀
      ctx.save()
      ctx.beginPath()
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, 14, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(26,20,16,0.85)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    } catch {
      // 커버 없을 때 바이닐 모양
      drawVinyl(ctx, imgX, imgY, imgSize)
    }
  } else {
    drawVinyl(ctx, imgX, imgY, imgSize)
  }

  // 오른쪽 텍스트 영역
  const textX = imgX + imgSize + 36
  const textMaxW = W - textX - 30
  let textY = imgY + 20

  // 장르 태그
  if (post.genre) {
    ctx.fillStyle = 'rgba(192,58,43,0.25)'
    const tagW = Math.min(ctx.measureText(post.genre.toUpperCase()).width + 20, 120)
    roundRect(ctx, textX, textY, tagW, 20, 3)
    ctx.fillStyle = '#C0392B'
    ctx.font = '600 9px monospace'
    ctx.letterSpacing = '2px'
    ctx.fillText(post.genre.toUpperCase(), textX + 10, textY + 14)
    textY += 34
  }

  // 곡 제목
  ctx.fillStyle = '#F2EDE4'
  ctx.font = `bold ${post.song_title.length > 18 ? '20px' : '24px'} Georgia, serif`
  ctx.letterSpacing = '0px'
  wrapText(ctx, post.song_title, textX, textY, textMaxW, 30)
  textY += post.song_title.length > 18 ? 56 : 36

  // 아티스트
  ctx.fillStyle = '#C9B99A'
  ctx.font = '400 14px monospace'
  ctx.fillText(post.artist, textX, textY)
  textY += 22

  // 연도
  if (post.year) {
    ctx.fillStyle = '#7B5C3E'
    ctx.font = '400 12px monospace'
    ctx.fillText(String(post.year), textX, textY)
    textY += 20
  }

  // 별점 표시
  if (post.user_reaction) {
    textY += 10
    const reaction = REACTIONS.find(r => r.key === post.user_reaction)
    if (reaction) {
      ctx.fillStyle = '#C0A020'
      ctx.font = '13px monospace'
      ctx.fillText(reaction.label, textX, textY)
    }
  }

  // 하단 사이트 정보
  const footerY = H - 28
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fillRect(0, footerY - 12, W, H)

  ctx.fillStyle = '#F2EDE4'
  ctx.font = 'bold 11px Georgia, serif'
  ctx.fillText('Phill', 40, footerY + 6)

  ctx.fillStyle = '#7B5C3E'
  ctx.font = '400 10px monospace'
  ctx.fillText('the Groove', 72, footerY + 6)

  ctx.fillStyle = '#3D2B1F'
  ctx.font = '400 9px monospace'
  ctx.fillText('phill-the-groove.netlify.app', W - 230, footerY + 6)

  // 레코드 바늘 디테일 (우측 하단)
  ctx.strokeStyle = 'rgba(192,168,100,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W - 20, 40)
  ctx.lineTo(W - 50, H - 40)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

function drawVinyl(ctx, x, y, size) {
  const cx = x + size / 2, cy = y + size / 2, r = size / 2
  // 외부 링
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy, r - i * 8, 0, Math.PI * 2)
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = 6
    ctx.stroke()
  }
  // 라벨 원
  ctx.beginPath()
  ctx.arc(cx, cy, 40, 0, Math.PI * 2)
  ctx.fillStyle = '#3D2B1F'
  ctx.fill()
  // 중앙 홀
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#0a0a0a'
  ctx.fill()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fill()
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineH
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, y)
}

// ── 공유 모달 ──
function ShareModal({ post, onClose }) {
  const [cardUrl, setCardUrl] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setGenerating(true)
    const url = await generateShareCard(post)
    setCardUrl(url)
    setGenerating(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText('https://phill-the-groove.netlify.app')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-groove-vinyl/80 backdrop-blur-sm px-4">
      <div className="bg-groove-cream w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-groove-vinyl via-groove-red to-groove-amber" />
        <div className="p-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-groove-label mb-0.5">Share this pick</p>
              <h3 className="font-display font-black text-groove-vinyl text-xl">공유하기</h3>
            </div>
            <button onClick={onClose} className="text-groove-dust hover:text-groove-brown text-lg">✕</button>
          </div>

          {/* 곡 정보 미리보기 */}
          <div className="flex items-center gap-3 bg-groove-paper rounded-lg p-3 mb-4 border border-groove-dust/40">
            <div className="w-10 h-10 rounded-full bg-groove-vinyl flex items-center justify-center shrink-0">
              {post.cover_url
                ? <img src={post.cover_url} alt="" className="w-full h-full rounded-full object-cover opacity-80" />
                : <div className="w-3 h-3 rounded-full bg-groove-label flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-groove-vinyl" /></div>
              }
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-groove-vinyl text-sm truncate">{post.song_title}</p>
              <p className="font-mono text-xs text-groove-label truncate">{post.artist}</p>
            </div>
          </div>

          {/* 카드 미리보기 */}
          {!cardUrl ? (
            <button
              onClick={generate}
              disabled={generating}
              className="w-full bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase py-3 rounded hover:bg-groove-brown transition-colors disabled:opacity-50 mb-3"
            >
              {generating ? '🎵 카드 생성 중...' : '🎨 공유 카드 만들기'}
            </button>
          ) : (
            <div className="mb-4">
              <img src={cardUrl} alt="share card" className="w-full rounded-lg border border-groove-dust/40 mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {/* 이미지 다운로드 */}
                <a
                  href={cardUrl}
                  download={`phill-groove-${post.song_title.replace(/\s+/g, '-')}.png`}
                  className="flex items-center justify-center gap-1.5 bg-groove-vinyl text-groove-cream font-mono text-[10px] tracking-widest uppercase py-2.5 rounded hover:bg-groove-brown transition-colors"
                >
                  ⬇ 이미지 저장
                </a>
                {/* 링크 복사 */}
                <button
                  onClick={copyLink}
                  className={`flex items-center justify-center gap-1.5 border font-mono text-[10px] tracking-widest uppercase py-2.5 rounded transition-colors ${
                    copied
                      ? 'border-groove-red text-groove-red bg-groove-red/10'
                      : 'border-groove-dust text-groove-label hover:border-groove-brown hover:text-groove-brown'
                  }`}
                >
                  {copied ? '✓ 복사됨!' : '🔗 링크 복사'}
                </button>
              </div>
            </div>
          )}

          {/* SNS 안내 */}
          <p className="font-mono text-[10px] text-groove-dust text-center">
            이미지를 저장한 뒤 Instagram, Twitter 등 SNS에 업로드하세요.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── PostCard ──
export default function PostCard({ post, onAuthRequired }) {
  const { user } = useAuth()
  const [userReaction, setUserReaction] = useState(post.user_reaction || null)
  const [counts, setCounts] = useState(post.reaction_counts || {})
  const [loading, setLoading] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

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
    <>
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7 drop-shadow-sm"
                    fill={isHighlighted ? '#C0A020' : 'none'}
                    stroke={isHighlighted ? '#C0A020' : '#BBBBBB'}
                    strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.499Z" />
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
            <div className="flex items-center gap-2">
              {/* 공유 버튼 */}
              <button
                onClick={() => setShareOpen(true)}
                title="Share this pick"
                className="font-mono text-[10px] text-groove-dust hover:text-groove-red transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
                Share
              </button>
              {user?.uid === post.user_id && (
                <button onClick={() => setEditOpen(true)} className="font-mono text-[10px] text-groove-dust hover:text-groove-brown transition-colors">
                  ✏️ Edit
                </button>
              )}
              <span className="font-mono text-[10px] text-groove-dust">
                {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
              </span>
            </div>
          </div>

          {editOpen && <NewPostModal onClose={() => setEditOpen(false)} editPost={post} />}
        </div>
      </article>

      {shareOpen && <ShareModal post={post} onClose={() => setShareOpen(false)} />}
    </>
  )
}
