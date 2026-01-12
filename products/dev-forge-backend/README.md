# Dev Forge Backend API

**Backend services for Dev Forge - Payment processing, license management, extension marketplace, and support systems.**

---

## 🚀 Quick Start

### **Prerequisites:**
- Node.js 18+
- PostgreSQL 14+
- Stripe account (for payment processing)

### **Installation:**

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

---

## 📋 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dev_forge
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Logging
LOG_LEVEL=info
```

---

## 🗄️ Database Schema

The database schema includes:
- **users** - User accounts
- **licenses** - License management
- **payments** - Payment transactions
- **extensions** - Extension marketplace
- **extension_reviews** - Extension ratings and reviews
- **support_tickets** - Support tickets
- **support_messages** - Ticket messages
- **knowledge_base** - Knowledge base articles

See `migrations/001_initial_schema.sql` for full schema.

---

## 📡 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### **Payments**
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/refund` - Create refund
- `POST /api/payments/webhook` - Stripe webhook

### **Licenses**
- `POST /api/licenses` - Create license (admin)
- `GET /api/licenses` - Get user licenses
- `GET /api/licenses/:id` - Get license by ID
- `POST /api/licenses/activate` - Activate license
- `POST /api/licenses/validate` - Validate license key
- `POST /api/licenses/:id/renew` - Renew license (admin)
- `POST /api/licenses/:id/revoke` - Revoke license (admin)

### **Extensions**
- `POST /api/extensions` - Submit extension
- `GET /api/extensions` - Search extensions
- `GET /api/extensions/:id` - Get extension by ID
- `GET /api/extensions/author/:authorId` - Get extensions by author
- `POST /api/extensions/:id/approve` - Approve extension (admin)
- `POST /api/extensions/:id/reject` - Reject extension (admin)
- `POST /api/extensions/:id/suspend` - Suspend extension (admin)
- `POST /api/extensions/:id/reviews` - Submit review
- `GET /api/extensions/:id/reviews` - Get reviews
- `DELETE /api/extensions/:id/reviews/:reviewId` - Delete review

### **Support**
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets` - Search tickets
- `GET /api/support/tickets/:id` - Get ticket
- `POST /api/support/tickets/:id/assign` - Assign ticket (admin/support)
- `POST /api/support/tickets/:id/status` - Update ticket status
- `POST /api/support/tickets/:id/messages` - Add message
- `GET /api/support/tickets/:id/messages` - Get messages
- `POST /api/support/knowledge-base` - Create article (admin/support)
- `GET /api/support/knowledge-base` - Search articles
- `GET /api/support/knowledge-base/:id` - Get article
- `POST /api/support/knowledge-base/:id/helpful` - Mark helpful

---

## 🔐 Authentication

Most endpoints require authentication via JWT token:

```
Authorization: Bearer <token>
```

### **Roles:**
- `user` - Regular user
- `admin` - Administrator
- `support` - Support staff

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📝 Development

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🗄️ Migrations

```bash
# Run migrations
npm run migrate

# Create new migration
# Add migration file to migrations/ directory
```

---

## 📊 Logging

Logs are written to:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- Console (in development)

---

## 🔒 Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Helmet security headers
- Input validation (Zod)
- SQL injection prevention (parameterized queries)

---

## 📚 Documentation

- API documentation: See route files in `src/routes/`
- Database schema: See `migrations/001_initial_schema.sql`
- Service documentation: See service files in `src/services/`

---

**Built with ❤️ by Xibalba Studio**

