import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './state/AuthContext'
import { logger } from './utils/logger'
import { FaReact, FaDatabase, FaLock, FaServer } from "react-icons/fa";
import { ProfileDropdown } from './components/ProfileDropdown'

function App() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <div className="blob one" />
      <div className="blob two" />
      <div className="blob three" />

      <div className="app-header" style={{ 
        padding: '24px 0', 
        marginBottom: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="brand" style={{ fontSize: '20px' }}>
          <div className="brand-badge" />
          Noteable
        </div>
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to="/notes" className="btn" style={{ width: 'auto', padding: '10px 14px' }}>My Notes</Link>
              <ProfileDropdown />
            </div>
          ) : (
            <div className="actions" style={{ gap: '12px' }}>
              <Link 
                to="/login" 
                className="btn btn-secondary" 
                style={{ 
                  width: 'auto', 
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px'
                }} 
                onClick={() => logger.userActivity('login_navigation')}
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="btn btn-primary" 
                style={{ 
                  width: 'auto', 
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px'
                }} 
                onClick={() => logger.userActivity('signup_navigation')}
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="hero" style={{ padding: '80px 16px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 className="hero-title" style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: '1.2', marginBottom: '24px' }}>
          Note it. Sort it. Done in <span className="accent">seconds</span>.
        </h1>
        <p className="hero-subtitle" style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', lineHeight: '1.6', marginBottom: '40px' }}>
          The simplest way to capture, organize, and access your thoughts. 
          No clutter, no complexity just pure productivity.
        </p>
        
        {!user && (
          <div className="actions" style={{ marginBottom: '48px' }}>
            <Link 
              to="/signup" 
              className="btn btn-primary" 
              style={{ 
                width: 'auto', 
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px'
              }} 
              onClick={() => logger.userActivity('get_started_navigation')}
            >
              Get Started Free
            </Link>
          </div>
        )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <span className="badge">
        <FaReact className="icon react" /> React + Vite
      </span>
      <span className="badge">
        <FaServer className="icon express" /> Express.js API
      </span>
      <span className="badge">
        <FaDatabase className="icon postgres" /> PostgreSQL
      </span>
      <span className="badge">
        <FaLock className="icon jwt" /> JWT Authentication
      </span>
      </div>
    </section>
    </div>
  )
}

export default App