import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logger } from '../utils/logger'

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const nav = useNavigate()
  const location = useLocation()
  
  const { email, otp } = location.state || {}

  useEffect(() => {
    if (!email || !otp) {
      nav('/forgot-password')
      return
    }
  }, [email, otp, nav])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      logger.userActivity('password_reset_attempt', undefined, email)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          otp, 
          newPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        logger.userActivity('password_reset_success', undefined, email)
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          nav('/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
        logger.userActivity('password_reset_error', undefined, email, { error: data.error })
      }
    } catch (err) {
      setError('Network error. Please try again.')
      logger.error('error', 'password_reset_network_error', { error: err })
    } finally {
      setLoading(false)
    }
  }

  if (!email || !otp) {
    return null
  }

  if (success) {
    return (
      <div className="page-bg">
        <div className="container-narrow">
          <div className="surface" style={{ padding: 32, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{
                width: 80,
                height: 80,
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 40
              }}>
                ✅
              </div>
              <h1 style={{ 
                margin: 0, 
                fontSize: 28, 
                color: 'var(--text-primary)', 
                fontWeight: 700,
                marginBottom: 8
              }}>
                Password Reset Successful!
              </h1>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: 16,
                lineHeight: 1.5
              }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid #22c55e',
              borderRadius: '8px',
              color: '#22c55e',
              fontSize: 14,
              marginBottom: 24
            }}>
              Redirecting to login page in 3 seconds...
            </div>

            <button
              onClick={() => nav('/login')}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366f1'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
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
              Reset Your Password
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: 16,
              lineHeight: 1.5
            }}>
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                fontSize: 14
              }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
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

            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                color: 'var(--text-primary)', 
                fontWeight: 600,
                fontSize: 14
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => nav('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
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
