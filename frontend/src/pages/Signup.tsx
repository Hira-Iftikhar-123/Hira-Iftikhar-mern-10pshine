import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { logger } from '../utils/logger'

export function Signup() {
  const nav = useNavigate()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      logger.userActivity('signup_form_submit', undefined, email)
      await signup(email, password)
      logger.userActivity('signup_success_navigation', undefined, email)
      nav('/')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Signup failed'
      setError(errorMsg)
      logger.userActivity('signup_form_error', undefined, email, { error: errorMsg })
    }
  }

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <div className="blob one" />
      <div className="blob two" />
      <div className="blob three" />

      <div className="center">
        <div className="card">
          <h2>Create account</h2>
          <p className="subtle" style={{ marginTop: -8, marginBottom: 20 }}>Join to start saving notes</p>
          <form className="stack" onSubmit={onSubmit}>
            <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary" type="submit">Create free account</button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="subtle" style={{ marginTop: 14 }}>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  )
}