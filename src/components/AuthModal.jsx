import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        if (!username.trim()) { setError('Username is required'); setLoading(false); return }
        await signUp(email, password, username.trim())
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-groove-vinyl/70 backdrop-blur-sm px-4">
      <div className="bg-groove-cream w-full max-w-sm rounded-lg shadow-2xl overflow-hidden relative">

        {/* Vinyl strip top */}
        <div className="h-2 bg-groove-vinyl" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-groove-label mb-1">
                {mode === 'signin' ? 'Welcome back' : 'Join the groove'}
              </p>
              <h2 className="font-display font-black text-groove-vinyl text-2xl">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
            </div>
            <button onClick={onClose} className="text-groove-dust hover:text-groove-brown text-xl leading-none">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="font-mono text-xs text-groove-label uppercase tracking-wider block mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your_groove_name"
                  className="w-full bg-groove-paper border border-groove-dust rounded px-3 py-2 font-mono text-sm text-groove-vinyl placeholder-groove-dust focus:outline-none focus:border-groove-brown"
                  required
                />
              </div>
            )}
            <div>
              <label className="font-mono text-xs text-groove-label uppercase tracking-wider block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-groove-paper border border-groove-dust rounded px-3 py-2 font-mono text-sm text-groove-vinyl placeholder-groove-dust focus:outline-none focus:border-groove-brown"
                required
              />
            </div>
            <div>
              <label className="font-mono text-xs text-groove-label uppercase tracking-wider block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-groove-paper border border-groove-dust rounded px-3 py-2 font-mono text-sm text-groove-vinyl placeholder-groove-dust focus:outline-none focus:border-groove-brown"
                required
              />
            </div>

            {error && (
              <p className="font-mono text-xs text-groove-red bg-groove-red/10 px-3 py-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-groove-vinyl text-groove-cream font-mono text-xs tracking-widest uppercase py-3 rounded hover:bg-groove-brown transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="font-mono text-xs text-groove-label text-center mt-4">
            {mode === 'signin' ? "Don't have an account? " : 'Already spinning? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
              className="text-groove-red hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
