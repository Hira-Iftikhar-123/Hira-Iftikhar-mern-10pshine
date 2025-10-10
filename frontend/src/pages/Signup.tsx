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
        <div className="card" style={{ maxWidth: '480px', padding: '46px 90px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="brand" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <div className="brand-badge" />
              <span style={{ fontSize: '24px', fontWeight: '700' }}>Noteable</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }}>Create your account</h2>
            <p className="subtle" style={{ fontSize: '16px', margin: '0' }}>Join thousands of users organizing their thoughts</p>
          </div>
          
          <form className="stack" onSubmit={onSubmit} style={{ gap: '20px' }}> 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Email Address</label>
              <input 
                className="input" 
                placeholder="Enter your email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                style={{ padding: '16px', fontSize: '16px', borderRadius: '12px' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Password</label>
              <input 
                className="input" 
                placeholder="Create a strong password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                style={{ padding: '16px', fontSize: '16px', borderRadius: '12px' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>
                Must be at least 6 characters long
              </p>
            </div>
            
            <button 
              className="btn btn-primary" 
              type="submit"
              style={{ 
                padding: '16px', 
                fontSize: '16px', 
                fontWeight: '600',
                borderRadius: '12px',
                marginTop: '8px'
              }}
            >
              Create Account
            </button>
            
            {error && (
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: 'rgba(255, 107, 107, 0.1)', 
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '8px',
                color: 'var(--error)',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p className="subtle" style={{ fontSize: '14px' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}