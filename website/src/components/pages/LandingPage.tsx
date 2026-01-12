import { Link } from 'react-router-dom'
import '../styles/LandingPage.css'

export function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              DEV FORGE
            </h1>
            <p className="hero-subtitle">
              AI-Powered Coding Editor with Multi-Model Support
            </p>
            <p className="hero-description">
              Code with the power of 11 AI models, local GGUF support, and extensible plugin architecture. 
              Built for developers who demand more from their editor.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn-primary btn-large">Get Started Free</Link>
              <Link to="/pricing" className="btn-secondary btn-large">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Multi-Model AI</h3>
              <p>Access 11 AI models simultaneously. Use local GGUF models or connect to remote APIs.</p>
            </div>
            <div className="feature-card">
              <h3>Extensible Plugins</h3>
              <p>Build and share extensions. Full plugin API with sandboxing and permissions.</p>
            </div>
            <div className="feature-card">
              <h3>Agentic Swarms</h3>
              <p>Fire Teams, HR systems, and wargaming. Coordinate multiple AI agents for complex tasks.</p>
            </div>
            <div className="feature-card">
              <h3>Local First</h3>
              <p>Run everything locally. Your code, your models, your data. Complete privacy.</p>
            </div>
            <div className="feature-card">
              <h3>Blockchain Integration</h3>
              <p>Identity, ledger, and data integrity. Built-in blockchain for trust and verification.</p>
            </div>
            <div className="feature-card">
              <h3>Marketplace</h3>
              <p>Discover and share extensions. Community-driven marketplace for plugins and tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2 className="cta-title">Ready to Transform Your Coding Experience?</h2>
          <p className="cta-description">
            Join developers who are already building the future with Dev Forge.
          </p>
          <Link to="/signup" className="btn-primary btn-large">Start Coding Now</Link>
        </div>
      </section>
    </div>
  )
}

