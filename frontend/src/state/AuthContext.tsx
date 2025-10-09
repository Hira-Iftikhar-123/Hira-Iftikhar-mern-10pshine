import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

type AuthUser = { id: string; email: string } | null

type AuthContextShape = {
  user: AuthUser
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<AuthUser>(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/auth/me').then(r => setUser(r.data)).catch(() => setUser(null))
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }, [token])

  async function login(email: string, password: string) {
    const { data } = await axios.post('/api/auth/login', { email, password })
    setToken(data.token)
  }

  async function signup(email: string, password: string) {
    await axios.post('/api/auth/signup', { email, password })
    await login(email, password)
  }

  function logout() {
    setToken(null)
  }

  const value = useMemo(() => ({ user, token, login, signup, logout }), [user, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


