# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Dev Forge SDK
- Core SDK with framework-agnostic architecture
- VS Code adapter for framework integration
- Plugin system with permission-based security
- GGUF model support with node-llama-cpp
- Custom API integration (Cursor, OpenAI, Anthropic, Custom)
- Model provider registry (Ollama, GGUF, API, Plugin)
- API provider registry with rate limiting and retry logic
- VS Code extension with 70+ settings
- Complete documentation and validation reports

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Secure API key storage using VS Code SecretStorage
- Permission-based plugin system
- Plugin sandboxing architecture

---

## [1.0.0] - 2025-01-12

### Added
- Initial release
- Core SDK package (`@dev-forge/core`)
- VS Code adapter package (`@dev-forge/vscode`)
- VS Code extension (`dev-forge`)
- Plugin system architecture
- GGUF provider implementation
- API provider implementations
- Comprehensive documentation

---

**For detailed changes, see commit history.**

