# Security Policy

## 🔒 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, please email security concerns to: **chris@vado42.ca**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Time

We will acknowledge receipt of your report within **48 hours** and provide a more detailed response within **7 days**.

### Disclosure Policy

- We will work with you to understand and resolve the issue
- We will credit you for the discovery (if desired)
- We will coordinate public disclosure after a fix is available

## 🛡️ Security Best Practices

### For Users

- Keep VS Code and the extension updated
- Use secure API key storage (SecretStorage)
- Review plugin permissions before installation
- Only install plugins from trusted sources

### For Developers

- Never commit API keys or credentials
- Use environment variables for sensitive data
- Review dependencies regularly (`npm audit`)
- Follow secure coding practices
- Keep dependencies updated

## 🔍 Known Security Considerations

- **API Keys:** Stored securely using VS Code SecretStorage
- **Plugin Sandboxing:** Architecture in place (process isolation planned)
- **Network Requests:** Rate limiting and retry logic implemented
- **Model Files:** Validation before loading

---

**Last Updated:** January 12, 2025

