import '../styles/DocsPage.css'

export function DocsPage() {
  return (
    <div className="docs-page">
      <div className="container">
        <div className="docs-header">
          <h1>Documentation</h1>
          <p className="docs-subtitle">Learn how to use Dev Forge</p>
        </div>

        <div className="docs-content">
          <div className="docs-sidebar">
            <nav className="docs-nav">
              <h3>Getting Started</h3>
              <ul>
                <li><a href="#installation">Installation</a></li>
                <li><a href="#quick-start">Quick Start</a></li>
                <li><a href="#configuration">Configuration</a></li>
              </ul>

              <h3>Features</h3>
              <ul>
                <li><a href="#ai-models">AI Models</a></li>
                <li><a href="#plugins">Plugins</a></li>
                <li><a href="#agents">Agents</a></li>
              </ul>

              <h3>API Reference</h3>
              <ul>
                <li><a href="#plugin-api">Plugin API</a></li>
                <li><a href="#model-api">Model API</a></li>
                <li><a href="#extension-api">Extension API</a></li>
              </ul>
            </nav>
          </div>

          <div className="docs-main">
            <section id="installation" className="docs-section">
              <h2>Installation</h2>
              <p>Download Dev Forge for your platform and follow the installation instructions.</p>
              <div className="code-block">
                <pre>
{`# Download from website
# Extract and run
./dev-forge`}
                </pre>
              </div>
            </section>

            <section id="quick-start" className="docs-section">
              <h2>Quick Start</h2>
              <p>Get up and running with Dev Forge in minutes.</p>
              <ol>
                <li>Install Dev Forge</li>
                <li>Configure your AI models</li>
                <li>Start coding with AI assistance</li>
              </ol>
            </section>

            <section id="configuration" className="docs-section">
              <h2>Configuration</h2>
              <p>Configure Dev Forge to match your workflow.</p>
              <div className="code-block">
                <pre>
{`{
  "models": {
    "default": "local-llama"
  },
  "plugins": {
    "enabled": true
  }
}`}
                </pre>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

