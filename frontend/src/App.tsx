import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './state/AuthContext'

function App() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <div className="blob one" />
      <div className="blob two" />
      <div className="blob three" />

      <div className="app-header">
        <div className="brand">
          <div className="brand-badge" />
          Noteable
        </div>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 12, color: 'var(--muted)' }}>{user.email}</span>
              <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => { logout(); nav('/login') }}>Logout</button>
            </>
          ) : (
            <div className="actions">
              <Link to="/login" className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px' }}>Log In</Link>
              <Link to="/notes" className="btn" style={{ width: 'auto', padding: '10px 14px', marginRight: 8 }}>My Notes</Link>
              <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '10px 14px' }}>Create Account</Link>
            </div>
          )}
        </div>
      </div>

      <section className="hero">
      <h1 className="hero-title">
            Note it. Sort it. Done in <span className="accent">seconds</span>.
          </h1>
          <p className="hero-subtitle">
            No clutter. No lag. Just notes, the way it should be.
          </p>
        {!user && (
          <div className="actions">
            <Link to="/signup" className="btn btn-primary" style={{ width: 'auto', padding: '12px 18px' }}>Get Started</Link>
          </div>
        )}
        <div className="badges">
          <span className="badge">JWT Auth</span>
          <span className="badge">PostgreSQL</span>
          <span className="badge">Express API</span>
          <span className="badge">React + Vite</span>
        </div>
      </section>
    </div>
  )
}

export default App
