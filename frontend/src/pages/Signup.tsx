import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

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
      await signup(email, password)
      nav('/')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed')
    }
  }

  return (
    <div>
      <h2>Create Account</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Sign up</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}


