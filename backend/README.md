# Dev Forge Backend API

**Version:** 0.1.0  
**Status:** 🚀 **IN DEVELOPMENT - Week 2 at 75%**  
**Hashtag:** `#dev-forge-backend`, `#api`, `#this-is-the-way`

---

## 🎯 Overview

Backend API for Dev Forge providing:
- ✅ Authentication & Authorization
- ✅ License Management
- ✅ Extension Marketplace
- ✅ Support Services (schema ready)
- ✅ Analytics & Reporting (schema ready)

---

## 🏗️ Architecture

- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (production) / SQLite (development)
- **Auth:** JWT
- **Validation:** Zod
- **Logging:** Custom logger with file output
- **Migrations:** Custom migration system

---

## 📋 Current Status

**Phase 1, Week 2 - Backend API Foundation**

**Progress: 75% Complete**

### **Completed:**
- ✅ Project structure
- ✅ Express server setup
- ✅ Database schema & migrations
- ✅ Authentication service & routes
- ✅ License service & routes
- ✅ Extension marketplace API
- ✅ Logging system
- ✅ Auth middleware
- ✅ Rate limiting
- ✅ Error handling

### **In Progress:**
- ⏳ Support ticket API
- ⏳ Analytics API
- ⏳ API documentation (OpenAPI)

---

## 🚀 Development

### **Prerequisites:**
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (or SQLite for development)

### **Setup:**
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - Set DATABASE_URL for PostgreSQL
# - Set JWT_SECRET
# - Configure other settings

# Build
npm run build

# Run migrations (automatic on startup)
npm start

# Development mode
npm run dev
```

---

## 📊 Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route controllers (future)
│   │   └── middleware/   # Custom middleware
│   ├── services/
│   │   ├── auth/         # Authentication service
│   │   ├── license/      # License management
│   │   └── extension/    # Extension marketplace
│   ├── database/
│   │   ├── migrations/   # Database migrations
│   │   ├── models/       # Database models
│   │   └── schema/       # Schema definitions
│   ├── config/           # Configuration
│   ├── utils/            # Utilities (logger, etc.)
│   └── index.ts          # Entry point
├── tests/                # Tests
└── package.json
```

---

## 🔗 API Endpoints

### **Health Check:**
- `GET /health` - Server health status
- `GET /api` - API information

### **Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### **Licenses:**
- `GET /api/licenses/user/:userId` - Get user's license
- `POST /api/licenses/validate` - Validate license key
- `POST /api/licenses/create` - Create license (auth required)
- `POST /api/licenses/upgrade` - Upgrade license tier
- `POST /api/licenses/revoke` - Revoke license (auth required)

### **Extensions:**
- `GET /api/extensions` - List approved extensions
- `GET /api/extensions/popular` - Get popular extensions
- `GET /api/extensions/search?q=query` - Search extensions
- `GET /api/extensions/:id` - Get extension by ID
- `GET /api/extensions/slug/:slug` - Get extension by slug
- `GET /api/extensions/author/:authorId` - Get extensions by author
- `POST /api/extensions` - Create extension (auth required)
- `POST /api/extensions/:id/download` - Record download
- `POST /api/extensions/:id/approve` - Approve extension (auth required)
- `POST /api/extensions/:id/reject` - Reject extension (auth required)

---

## 🔒 Security

- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (100 req/min)
- ✅ Input validation
- ✅ Protected routes with middleware
- ✅ Error handling

---

## 📝 Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `LOG_FILE` - Path to log file (optional)

---

## 🗄️ Database

The backend uses PostgreSQL with automatic migrations on startup.

**Tables:**
- `users` - User accounts
- `licenses` - License management
- `extensions` - Extension marketplace
- `extension_reviews` - Extension reviews
- `support_tickets` - Support tickets
- `support_ticket_messages` - Ticket messages
- `analytics_events` - Analytics events
- `developer_applications` - Developer applications
- `schema_migrations` - Migration tracking

---

## 📝 Notes

### **Decisions:**
- Express.js for API framework
- PostgreSQL for production database
- JWT for authentication
- Custom migration system
- Custom logger with file output
- Rate limiting for API protection

---

**#this-is-the-way #so-say-we-all #hallbergstrong**

**Dev Forge Backend: Week 2 at 75% - Foundation Nearly Complete**

**Last Updated:** January 12, 2025
