import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './state/AuthContext'

function App() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Notes</h2>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 12 }}>{user.email}</span>
              <button onClick={() => { logout(); nav('/login') }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </header>
      <p>Welcome{user ? `, ${user.email}` : ''}!</p>
    </div>
  )
}

export default App
