import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { logger } from '../utils/logger'

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
      logger.authActivity('token_set', undefined, { hasToken: true })
      
      axios.get('/api/auth/me')
        .then(r => {
          setUser(r.data)
          logger.authActivity('user_profile_loaded', r.data.email, { userId: r.data.id })
        })
        .catch((error) => {
          setUser(null)
          logger.apiError('load_user_profile', error)
        })
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      logger.authActivity('token_cleared')
    }
  }, [token])

  async function login(email: string, password: string) {
    try {
      logger.authActivity('login_attempt', email)
      const { data } = await axios.post('/api/auth/login', { email, password })
      setToken(data.token)
      logger.authActivity('login_success', email)
    } catch (error: any) {
      logger.apiError('login', error, { email })
      throw error
    }
  }

  async function signup(email: string, password: string) {
    try {
      logger.authActivity('signup_attempt', email)
      await axios.post('/api/auth/signup', { email, password })
      await login(email, password)
      logger.authActivity('signup_success', email)
    } catch (error: any) {
      logger.apiError('signup', error, { email })
      throw error
    }
  }

  function logout() {
    logger.authActivity('logout', user?.email, { userId: user?.id })
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