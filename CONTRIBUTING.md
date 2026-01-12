# Contributing to Dev Forge

Thank you for your interest in contributing to Dev Forge! 🎸

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js >= 18.0.0
- npm >= 9.0.0
- VS Code (for extension development)
- Git

### **Setup**

```bash
# Clone the repository
git clone https://github.com/Vado42-chris/xi-io-dev_forge.git
cd xi-io-dev_forge

# Install dependencies
npm install

# Build all packages
npm run build
```

---

## 🔄 Development Workflow

### **1. Create a Feature Branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### **2. Make Changes**

- Write clear, focused code
- Follow coding standards
- Add tests for new features
- Update documentation

### **3. Test Your Changes**

```bash
# Run tests
npm run test

# Build to check for errors
npm run build

# Lint your code
npm run lint
```

### **4. Commit Your Changes**

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in provider"
git commit -m "docs: update README"
```

### **5. Push and Create PR**

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 📝 Coding Standards

### **TypeScript**

- Use strict mode
- Provide type annotations
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use async/await over promises

### **Code Style**

- 2-space indentation
- Use meaningful variable names
- Keep functions focused and small
- Add JSDoc comments for public APIs
- Follow existing code patterns

### **File Organization**

```
packages/core/src/
├── api/           # API providers
├── plugins/       # Plugin system
├── providers/     # Model providers
└── types/         # Type definitions
```

---

## 💬 Commit Guidelines

### **Format**

```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

### **Examples**

```bash
feat(plugins): add permission validation
fix(api): resolve rate limit issue
docs(readme): update installation instructions
refactor(core): simplify provider registry
```

---

## 🔀 Pull Request Process

### **Before Submitting**

1. ✅ Code follows style guidelines
2. ✅ Tests pass locally
3. ✅ Documentation updated
4. ✅ No console.logs or debug code
5. ✅ Commit messages follow conventions

### **PR Checklist**

- [ ] Description is clear and complete
- [ ] Related issue referenced (if applicable)
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CI checks pass
- [ ] Code reviewed by maintainer

### **Review Process**

- Maintainers will review within 48 hours
- Address feedback promptly
- Keep PR focused (one logical change)
- Squash commits before merging (if requested)

---

## 🧪 Testing

### **Running Tests**

```bash
# All tests
npm run test

# Specific package
npm run test --workspace=@dev-forge/core

# Watch mode
npm run test -- --watch
```

### **Writing Tests**

- Test public APIs
- Test error cases
- Test edge cases
- Keep tests focused and readable

---

## 📚 Documentation

### **Code Documentation**

- JSDoc for public functions
- Inline comments for complex logic
- README for package overview
- Architecture docs for design decisions

### **Updating Documentation**

- Update README when adding features
- Update architecture docs for design changes
- Add examples for new APIs
- Keep documentation in sync with code

---

## 🐛 Reporting Issues

Use GitHub Issues with appropriate template:
- Bug reports
- Feature requests
- Questions

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details

---

## ❓ Questions?

- Open a GitHub Discussion
- Check existing documentation
- Review closed issues/PRs

---

## 🙏 Thank You!

Your contributions make Dev Forge better for everyone!

---

**Last Updated:** January 12, 2025

