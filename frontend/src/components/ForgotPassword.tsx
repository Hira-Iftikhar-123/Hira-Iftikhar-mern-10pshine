import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logger } from '../utils/logger'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      logger.userActivity('forgot_password_request', undefined, email)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        logger.userActivity('forgot_password_success', undefined, email)
        
        // Navigate to OTP verification page
        setTimeout(() => {
          nav('/verify-otp', { state: { email } })
        }, 2000)
      } else {
        setError(data.error || 'Failed to send reset email')
        logger.userActivity('forgot_password_error', undefined, email, { error: data.error })
      }
    } catch (err) {
      setError('Network error. Please try again.')
        logger.error('error', 'forgot_password_network_error', { error: err })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg">
      <div className="container-narrow">
        <div className="surface" style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: 28, 
              color: 'var(--text-primary)', 
              fontWeight: 700,
              marginBottom: 8
            }}>
              Forgot Password?
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: 16,
              lineHeight: 1.5
            }}>
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                fontSize: 14
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1'
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: 14,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                color: '#22c55e',
                fontSize: 14,
                marginBottom: 16
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading ? 'var(--muted)' : '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 16
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#5b21b6'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#6366f1'
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => nav('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
