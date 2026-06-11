import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, 'profiles', uid))
    if (snap.exists()) setProfile({ id: snap.id, ...snap.data() })
    setLoading(false)
  }

  async function signUp(email, password, username) {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    const profileData = {
      username,
      total_score: 0,
      streak: 0,
      last_post_date: null,
      created_at: new Date().toISOString(),
    }
    await setDoc(doc(db, 'profiles', newUser.uid), profileData)
    setProfile({ id: newUser.uid, ...profileData })
  }

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.uid)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
