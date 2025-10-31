import crypto from 'crypto'
import logger from '../utils/logger'

interface OTPData {
  email: string
  otp: string
  expiresAt: Date
  attempts: number
}

const otpStorage = new Map<string, OTPData>()

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date()
  for (const [email, data] of otpStorage.entries()) {
    if (data.expiresAt < now) {
      otpStorage.delete(email)
      logger.debug({ email }, 'Expired OTP cleaned up')
    }
  }
}, 5 * 60 * 1000)

export const generateOTP = (): string => {
  // Generate 6-digit OTP
  return crypto.randomInt(100000, 999999).toString()
}

export const storeOTP = (email: string): string => {
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  
  otpStorage.set(email, {
    email,
    otp,
    expiresAt,
    attempts: 0
  })
  
  logger.info({ email, expiresAt }, 'OTP stored for password reset')
  return otp
}

export const verifyOTP = (email: string, inputOTP: string): { valid: boolean; message: string } => {
  const storedData = otpStorage.get(email)
  
  if (!storedData) {
    logger.warn({ email }, 'OTP verification failed - no OTP found')
    return { valid: false, message: 'OTP not found or expired' }
  }
  
  if (storedData.expiresAt < new Date()) {
    otpStorage.delete(email)
    logger.warn({ email }, 'OTP verification failed - expired')
    return { valid: false, message: 'OTP has expired' }
  }
  
  if (storedData.attempts >= 3) {
    otpStorage.delete(email)
    logger.warn({ email }, 'OTP verification failed - too many attempts')
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' }
  }
  
  if (storedData.otp !== inputOTP) {
    storedData.attempts++
    logger.warn({ email, attempts: storedData.attempts }, 'OTP verification failed - incorrect OTP')
    return { valid: false, message: `Incorrect OTP. ${3 - storedData.attempts} attempts remaining.` }
  }
  
  // OTP is valid
  otpStorage.delete(email)
  logger.info({ email }, 'OTP verification successful')
  return { valid: true, message: 'OTP verified successfully' }
}

export const clearOTP = (email: string): void => {
  otpStorage.delete(email)
  logger.debug({ email }, 'OTP cleared')
}

export const getOTPExpiry = (email: string): Date | null => {
  const storedData = otpStorage.get(email)
  return storedData ? storedData.expiresAt : null
}
