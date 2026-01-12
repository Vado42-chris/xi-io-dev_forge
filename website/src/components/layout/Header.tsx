import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../styles/Header.css'

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-text">DEV FORGE</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/docs" className="nav-link">Docs</Link>
            <Link to="/community" className="nav-link">Community</Link>
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <span className="user-info">{user?.username}</span>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Login</Link>
                <Link to="/signup" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

