import { Link } from 'react-router-dom'
import '../styles/Header.css'

export function Header() {
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
            <Link to="/login" className="btn-secondary">Login</Link>
            <Link to="/signup" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </div>
    </header>
  )
}

