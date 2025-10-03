import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      nav('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <div className="blob one" />
      <div className="blob two" />
      <div className="blob three" />

      <div className="center">
        <div className="card">
          <h2>Welcome back</h2>
          <p className="subtle" style={{ marginTop: -8, marginBottom: 20 }}>Log in to your account</p>
          <form className="stack" onSubmit={onSubmit}>
            <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn btn-primary" type="submit">Log In</button>
            {error && <p className="error">{error}</p>}
          </form>
          <p className="subtle" style={{ marginTop: 14 }}>New here? <Link to="/signup">Create account</Link></p>
        </div>
      </div>
    </div>
  )
}


