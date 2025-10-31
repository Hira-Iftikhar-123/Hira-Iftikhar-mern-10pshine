import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt="Profile" 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '2px solid var(--primary)'
            }} 
          />
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {user.name || user.email}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>▼</span>
      </button>

      {isOpen && (
      <div
        className="profile-dropdown"
        style={{
          position: 'absolute',
          top: '115%', // move slightly lower
          right: 0,
          width: '280px',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          zIndex: 9999,
          animation: 'slideDown 0.25s ease',
        }}
      >
        {/* Profile Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #F7E7CE, #D4AF37)',
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid white',
                marginBottom: '12px',
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 auto 12px',
                border: '3px solid white',
              }}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ color: 'white', fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
            {user.name || 'User'}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            {user.email}
          </div>
        </div>

        {/* Menu Options */}
        <div style={{ padding: '8px 0' }}>
          <button
            onClick={() => {
              nav('/profile')
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'white',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: '16px' }}>✏️</span>
            Edit Profile
          </button>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', margin: '8px 0' }} />

          <button
            onClick={() => {
              logout()
              nav('/login')
              setIsOpen(false)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#ff6b6b',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Logout
          </button>
        </div>
      </div>
    )}
    </div>
  )
}