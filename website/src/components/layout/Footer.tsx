import { Link } from 'react-router-dom'
import '../styles/Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>DEV FORGE</h3>
            <p>AI-Powered Coding Editor</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <Link to="/pricing">Pricing</Link>
            <Link to="/features">Features</Link>
            <Link to="/docs">Documentation</Link>
          </div>
          <div className="footer-section">
            <h4>Community</h4>
            <Link to="/community">Community</Link>
            <Link to="/extensions">Extensions</Link>
            <Link to="/support">Support</Link>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Xibalba Mixed Media Studio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

