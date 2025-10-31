import { useState, useRef, useEffect } from 'react'

interface OTPInputProps {
  length?: number
  onComplete: (otp: string) => void
  onError?: (error: string) => void
}

export function OTPInput({ length = 6, onComplete, onError }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if OTP is complete
    const otpString = newOtp.join('')
    if (otpString.length === length) {
      onComplete(otpString)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    
    if (pastedData.length === length) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      
      // Focus the last input
      inputRefs.current[length - 1]?.focus()
      
      onComplete(pastedData)
    } else {
      onError?.('Please paste a valid 6-digit OTP')
    }
  }

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '20px 0' }}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }} 
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '48px',
            height: '48px',
            fontSize: '24px',
            textAlign: 'center',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontWeight: '600'
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
      ))}
    </div>
  )
}
