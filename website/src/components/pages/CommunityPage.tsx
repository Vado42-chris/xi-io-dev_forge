import { Link } from 'react-router-dom'
import '../styles/CommunityPage.css'

export function CommunityPage() {
  return (
    <div className="community-page">
      <div className="container">
        <div className="community-header">
          <h1>Community</h1>
          <p className="community-subtitle">Join the Dev Forge community</p>
        </div>

        <div className="community-grid">
          <div className="community-card">
            <h3>Extensions Marketplace</h3>
            <p>Discover and share extensions built by the community.</p>
            <Link to="/extensions" className="btn-primary">
              Browse Extensions
            </Link>
          </div>

          <div className="community-card">
            <h3>Forums</h3>
            <p>Discuss features, ask questions, and share your work.</p>
            <a href="#" className="btn-secondary">
              Visit Forums
            </a>
          </div>

          <div className="community-card">
            <h3>GitHub</h3>
            <p>Contribute to Dev Forge on GitHub.</p>
            <a href="https://github.com/Vado42-chris/xi-io-dev_forge" className="btn-secondary" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </div>

          <div className="community-card">
            <h3>Discord</h3>
            <p>Join our Discord server for real-time discussions.</p>
            <a href="#" className="btn-secondary">
              Join Discord
            </a>
          </div>
        </div>

        <div className="community-stats">
          <div className="stat-card">
            <h3>1,000+</h3>
            <p>Active Users</p>
          </div>
          <div className="stat-card">
            <h3>50+</h3>
            <p>Extensions</p>
          </div>
          <div className="stat-card">
            <h3>100+</h3>
            <p>Contributors</p>
          </div>
        </div>
      </div>
    </div>
  )
}

