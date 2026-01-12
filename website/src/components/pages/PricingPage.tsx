import { Link } from 'react-router-dom'
import '../styles/PricingPage.css'

export function PricingPage() {
  return (
    <div className="pricing-page">
      <div className="container">
        <div className="pricing-header">
          <h1>Pricing</h1>
          <p className="pricing-subtitle">
            Choose the plan that fits your needs. All plans include core features.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card">
            <div className="pricing-header-card">
              <h2>Free</h2>
              <div className="price">
                <span className="price-amount">$0</span>
                <span className="price-period">/forever</span>
              </div>
            </div>
            <ul className="features-list">
              <li>✓ Core editor features</li>
              <li>✓ Local GGUF model support</li>
              <li>✓ Basic plugin system</li>
              <li>✓ Community extensions</li>
              <li>✓ 1 AI model at a time</li>
            </ul>
            <Link to="/signup" className="btn-secondary btn-full">Get Started</Link>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card featured">
            <div className="badge">Popular</div>
            <div className="pricing-header-card">
              <h2>Pro</h2>
              <div className="price">
                <span className="price-amount">$99</span>
                <span className="price-period">/one-time</span>
              </div>
            </div>
            <ul className="features-list">
              <li>✓ Everything in Free</li>
              <li>✓ All 11 AI models</li>
              <li>✓ Multi-model prompts</li>
              <li>✓ Advanced plugin API</li>
              <li>✓ Agentic swarms</li>
              <li>✓ Priority support</li>
              <li>✓ Commercial license</li>
            </ul>
            <Link to="/signup?tier=pro" className="btn-primary btn-full">Upgrade to Pro</Link>
          </div>

          {/* Enterprise Tier */}
          <div className="pricing-card">
            <div className="pricing-header-card">
              <h2>Enterprise</h2>
              <div className="price">
                <span className="price-amount">$499</span>
                <span className="price-period">/one-time</span>
              </div>
            </div>
            <ul className="features-list">
              <li>✓ Everything in Pro</li>
              <li>✓ Custom AI model integration</li>
              <li>✓ White-label options</li>
              <li>✓ Dedicated support</li>
              <li>✓ Team management</li>
              <li>✓ Advanced analytics</li>
              <li>✓ SLA guarantee</li>
            </ul>
            <Link to="/contact" className="btn-secondary btn-full">Contact Sales</Link>
          </div>
        </div>

        <div className="pricing-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Is there a subscription fee?</h3>
              <p>No. Dev Forge uses a one-time payment model. Pay once, use forever.</p>
            </div>
            <div className="faq-item">
              <h3>Can I upgrade later?</h3>
              <p>Yes. You can upgrade from Free to Pro or Enterprise at any time.</p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards and cryptocurrency.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer refunds?</h3>
              <p>Yes. We offer a 30-day money-back guarantee on all paid plans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

