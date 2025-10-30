import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { OTPInput } from './OTPInput'
import { logger } from '../utils/logger'

export function VerifyOTP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const nav = useNavigate()
  const location = useLocation()
  
  const email = location.state?.email

  useEffect(() => {
    if (!email) {
      nav('/forgot-password')
      return
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, nav])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOTPComplete = async (otpValue: string) => {
    setLoading(true)
    setError('')

    try {
      logger.userActivity('otp_verification_attempt', undefined, email)

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpValue }),
      })

      const data = await response.json()

      if (response.ok) {
        logger.userActivity('otp_verification_success', undefined, email)
        nav('/reset-password', { state: { email, otp: otpValue } })
      } else {
        setError(data.error || 'Invalid OTP')
        logger.userActivity('otp_verification_error', undefined, email, { error: data.error })
      }
    } catch (err) {
      setError('Network error. Please try again.')
      logger.error('error', 'otp_verification_network_error', { error: err })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')
    setTimeLeft(600)

    try {
      logger.userActivity('otp_resend_request', undefined, email)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        logger.userActivity('otp_resend_success', undefined, email)
        // Start new countdown
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || 'Failed to resend OTP')
        logger.userActivity('otp_resend_error', undefined, email, { error: data.error })
      }
    } catch (err) {
      setError('Network error. Please try again.')
      logger.error('error', 'otp_resend_network_error', { error: err })
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return null
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
              Enter Verification Code
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)', 
              fontSize: 16,
              lineHeight: 1.5
            }}>
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <OTPInput 
              length={6} 
              onComplete={handleOTPComplete}
              onError={setError}
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
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 14,
              marginBottom: 16
            }}>
              Verifying...
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {timeLeft > 0 ? (
              <p style={{ 
                margin: 0, 
                color: 'var(--text-secondary)', 
                fontSize: 14 
              }}>
                Resend code in {formatTime(timeLeft)}
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 600
                }}
              >
                Resend Code
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => nav('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Change Email Address
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
