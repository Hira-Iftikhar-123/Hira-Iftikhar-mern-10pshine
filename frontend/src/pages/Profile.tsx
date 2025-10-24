import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import { logger } from '../utils/logger'
import axios from 'axios'

export function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email)
      setProfilePicture(user.profilePicture || null)
    }
  }, [user])

  function handleProfilePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 2MB for profile pictures)
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile picture size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      if (imageUrl) {
        setProfilePicture(imageUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      logger.userActivity('profile_update_attempt', user?.id, user?.email)

      const updateData: any = {
        name: name.trim(),
        profilePicture
      }

      // Only include password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match')
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters')
        }
        updateData.currentPassword = currentPassword
        updateData.newPassword = newPassword
      }

      await axios.put('/api/auth/profile', updateData)
      
      logger.userActivity('profile_update_success', user?.id, user?.email)
      setSuccess('Profile updated successfully!')
      
      // Refresh user data to get updated profile
      await refreshUser()
      
      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err.message || 'Failed to update profile'
      setError(errorMsg)
      logger.userActivity('profile_update_error', user?.id, user?.email, { error: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      logger.userActivity('account_deletion_attempt', user?.id, user?.email)
      await axios.delete('/api/auth/profile')
      logout()
      nav('/')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to delete account'
      setError(errorMsg)
      logger.userActivity('account_deletion_error', user?.id, user?.email, { error: errorMsg })
    }
  }

  return (
    <div className="page-bg">
      <div className="container-narrow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 60 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)' }}>Profile Settings</h1>
            <button 
              onClick={() => nav('/notes')} 
              className="btn btn-secondary" 
              style={{ color: '#aa3377', width: 'auto', padding: '10px 20px' }}
            >
              Back to Notes
            </button>
          </div>
        </div>

        <div className="surface" style={{ padding: 32 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#b91c1c',
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#166534',
              fontSize: 14,
              marginBottom: 16
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: 20 }}>
            {/* Profile Picture Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 16, fontWeight: '600', color: 'var(--text-primary)' }}>
                Profile Picture
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    style={{ display: 'none' }}
                    id="profile-picture-upload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('profile-picture-upload')?.click()}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 14, borderRadius: 8, width: 'auto', color: '#702963' }}
                  >
                    📷 Change Photo
                  </button>
                </div>
                {profilePicture && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '3px solid var(--primary)'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setProfilePicture(null)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--error)', 
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-primary)' }}>
                Full Name
              </label>
              <input
                className="editor-input"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Email Field (Read-only) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <input
                className="editor-input"
                value={email}
                disabled
                style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
              />
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                Email cannot be changed
              </p>
            </div>

            {/* Password Section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--text-primary)' }}>
                Change Password
              </h3>
              
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-primary)' }}>
                    Current Password
                  </label>
                  <input
                    className="editor-input"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-primary)' }}>
                    New Password
                  </label>
                  <input
                    className="editor-input"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: '600', color: 'var(--text-primary)' }}>
                    Confirm New Password
                  </label>
                  <input
                    className="editor-input"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>
                Leave password fields empty to keep current password
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '12px 24px', fontSize: 16, width: 'auto', color: '#702963' }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn btn-secondary"
                style={{ 
                  padding: '12px 24px', 
                  fontSize: 16, 
                  width: 'auto',
                  color: '#b91c1c',
                  borderColor: '#fecaca'
                }}
              >
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
