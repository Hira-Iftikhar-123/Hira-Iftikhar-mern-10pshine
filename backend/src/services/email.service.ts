import nodemailer from 'nodemailer'
import logger from '../utils/logger'

// Email configuration for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '99f1c6001@smtp-brevo.com',
    pass: process.env.EMAIL_PASS || 'OD10L9tSHw6aZEcv'
  },
  tls: {
    rejectUnauthorized: false
  }
})

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Brevo SMTP verification failed:')
    console.log('Error:', error.message)
    console.log('')
    console.log('To fix this:')
    console.log('1. Check your Brevo SMTP credentials in .env file')
    console.log('2. Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS')
    console.log('3. Make sure your Brevo account is active')
    console.log('')
    console.log('For now, OTPs will be logged to console instead of sent via email')
  } else {
    logger.info({ success }, 'Brevo email service is ready to send messages')
    console.log('Brevo email service configured successfully!')
  }
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    }

    const result = await transporter.sendMail(mailOptions)
    logger.info({ messageId: result.messageId, to: options.to, subject: options.subject }, 'Email sent successfully')
    return true
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to send email')
    return false
  }
}

export const sendPasswordResetOTP = async (email: string, otp: string, userName?: string): Promise<boolean> => {
  try {
    console.log(`Attempting to send OTP to: ${email}`)
    console.log(`OTP Code: ${otp}`)
    console.log(`User Name: ${userName || 'Not provided'}`)
    
    const subject = 'Password Reset - Your OTP Code'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName || 'User'},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Use the OTP code below to proceed with password reset:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #667eea;">
            <h3 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0; font-family: monospace;">${otp}</h3>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6;">
            <li>This OTP is valid for <strong>10 minutes</strong> only</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this password reset, please ignore this email</li>
          </ul>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `

    const result = await sendEmail({ to: email, subject, html })
    
    if (result) {
      console.log(`OTP email sent successfully to: ${email}`)
      return true
    } else {
      console.log(`Failed to send email to: ${email}`)
      console.log(`OTP for ${email}: ${otp}`)
      console.log(`Please use this OTP manually`)
      return true // Still return true so the flow continues
    }
  } catch (error) {
    console.log(`Email sending error for ${email}:`, error)
    console.log(`OTP for ${email}: ${otp}`)
    console.log(`Please use this OTP manually`)
    return true // Still return true so the flow continues
  }
}

export const sendPasswordResetSuccess = async (email: string, userName?: string): Promise<boolean> => {
  const subject = 'Password Reset Successful'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Successful</h1>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${userName || 'User'},</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #4ade80;">
          <p style="color: #4ade80; font-size: 18px; margin: 0; font-weight: bold;">Password Updated Successfully</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't make this change, please contact our support team immediately.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `

  return await sendEmail({ to: email, subject, html })
}
