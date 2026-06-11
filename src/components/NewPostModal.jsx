import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { db } from '../lib/firebase'
import { collection, addDoc, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore'

export default function NewPostModal({ onClose, editPost = null }) {
  const { user, profile } = useAuth()
  const isEdit = !!editPost

  const [form, setForm] = useState({
    song_title: editPost?.song_title || '',
    artist: editPost?.artist || '',
    genre: editPost?.genre || '',
    year: editPost?.year || '',
    note: editPost?.note || '',
    cover_url: editPost?.cover_url || '',
    spotify_url: editPost?.spotify_url || '',
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.song_title.trim() || !form.artist.trim()) { setError('Song title and artist are required.'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        // 수정
        await updateDoc(doc(db, 'posts', editPost.id), {
          song_title: form.song_title.trim(),
          artist: form.artist.trim(),
          genre: form.genre.trim() || null,
          year: form.year ? parseInt(form.year) : null,
          note: form.note.trim() || null,
          cover_url: form.cover_url.trim() || null,
          spotify_url: form.spotify_url.trim() || null,
        })
      } else {
        // 새 포스트
        await addDoc(collection(db, 'posts'), {
          user_id: user.uid,
          author_name: profile.username,
          author_score: profile.total_score || 0,
          song_title: form.song_title.trim(),
          artist: form.artist.trim(),
          genre: form.genre.trim() || null,
          year: form.year ? parseInt(form.year) : null,
          note: form.note.trim() || null,
          cover_url: form.cover_url.trim() || null,
          spotify_url: form.spotify_url.trim() || null,
          created_at: new Date().toISOString(),
        })

        // Update streak
        const today = new Date().toDateString()
        const profileRef = doc(db, 'profiles', user.uid)
        const lastDate = profile.last_post_date
        if (lastDate !== today) {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
          const isConsecutive = lastDate === yesterday.toDateString()
          await updateDoc(profileRef, {
            streak: isConsecutive ? increment(1) : 1,
            last_post_date: today,
          })
        }
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'posts', editPost.id))
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const field = (label, key, props = {}) => (
    <div>
      <label className="font-mono text-xs text-groove-label uppercase tracking-wider block mb-1">{label}</label>
      <input value={form[key]} onChange={set(key)} className="w-full bg-groove-paper border border-groove-dust rounded px-3 py-2 font-mono text-sm text-groove-vinyl placeholder-groove-dust/70 focus:outline-none focus:border-groove-brown" {...props} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-groove-vinyl/70 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="bg-groove-cream w-full max-w-md rounded-lg shadow-2xl overflow-hidden my-auto">
        <div className="h-2 bg-gradient-to-r from-groove-vinyl via-groove-red to-groove-amber" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-groove-label mb-1">
                {isEdit ? 'Edit your pick' : 'Drop a recommendation'}
              </p>
              <h2 className="font-display font-black text-groove-vinyl text-2xl">
                {isEdit ? 'Edit Pick' : 'New Pick'}
              </h2>
            </div>
            <button onClick={onClose} className="text-groove-dust hover:text-groove-brown text-xl">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {field('Song Title *', 'song_title', { placeholder: 'So What', required: true })}
            {field('Artist *', 'artist', { placeholder: 'Miles Davis', required: true })}
            <div className="grid grid-cols-2 gap-3">
              {field('Genre', 'genre', { placeholder: 'Jazz' })}
              {field('Year', 'year', { placeholder: '1959', type: 'number', min: '1900', max: '2099' })}
            </div>
            {field('Album Cover URL', 'cover_url', { placeholder: 'https://...' })}
            {field('Spotify URL', 'spotify_url', { placeholder: 'https://open.spotify.com/track/...' })}
            <div>
              <label className="font-mono text-xs text-groove-label uppercase tracking-wider block mb-1">Your Take</label>
              <textarea value={form.note} onChange={set('note')} rows={3} placeholder="Why does this one hit different?" className="w-full bg-groove-paper border border-groove-dust rounded px-3 py-2 font-mono text-sm text-groove-vinyl placeholder-groove-dust/70 focus:outline-none focus:border-groove-brown resize-none" />
            </div>
            {error && <p className="font-mono text-xs text-groove-red bg-groove-red/10 px-3 py-2 rounded">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase py-3 rounded hover:bg-groove-brown transition-colors disabled:opacity-50">
              {loading ? (isEdit ? 'Saving...' : 'Dropping...') : (isEdit ? '✏️ Save Changes' : '🎵 Drop the Pick')}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full border border-groove-red/40 text-groove-red font-mono text-xs tracking-widest uppercase py-3 rounded hover:bg-groove-red/10 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : '🗑 Delete Post'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
