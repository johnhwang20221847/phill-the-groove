import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
import Home from './pages/Home'
import Rate from './pages/Rate'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import Archive from './pages/Archive'

function AppInner() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="min-h-screen bg-groove-cream bg-grain">
      <Navbar onAuthOpen={() => setAuthOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home onAuthRequired={() => setAuthOpen(true)} />} />
          <Route path="/rate" element={<Rate onAuthRequired={() => setAuthOpen(true)} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile/:id" element={<Profile onAuthRequired={() => setAuthOpen(true)} />} />
          <Route path="/archive" element={<Archive onAuthRequired={() => setAuthOpen(true)} />} />
        </Routes>
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}
