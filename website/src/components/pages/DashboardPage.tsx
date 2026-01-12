import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import '../styles/DashboardPage.css'

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-card">
            <h2>Welcome, {user?.username}!</h2>
            <p>Email: {user?.email}</p>
            <p>Tier: <span className="tier-badge">{user?.tier}</span></p>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Your License</h3>
              <p className="license-status">Active</p>
              <p className="license-tier">{user?.tier.toUpperCase()}</p>
              <Link to="/license" className="btn-secondary btn-small">
                View License Details
              </Link>
            </div>

            <div className="dashboard-card">
              <h3>Extensions</h3>
              <p className="extension-count">0 installed</p>
              <Link to="/extensions" className="btn-secondary btn-small">
                Browse Extensions
              </Link>
            </div>

            <div className="dashboard-card">
              <h3>Support</h3>
              <p className="support-status">No open tickets</p>
              <Link to="/support" className="btn-secondary btn-small">
                Get Support
              </Link>
            </div>

            <div className="dashboard-card">
              <h3>Downloads</h3>
              <p className="download-link">
                <a href="#" className="btn-primary btn-small">
                  Download Dev Forge
                </a>
              </p>
              <p className="download-info">Latest version available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

