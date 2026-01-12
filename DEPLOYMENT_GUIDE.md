# 🚀 Dev Forge Deployment Guide

**Date:** January 12, 2025  
**Status:** 📋 **DEPLOYMENT GUIDE**  
**Hashtag:** `#deployment`, `#guide`, `#dev-forge`, `#this-is-the-way`

---

## 🎯 EXECUTIVE SUMMARY

Step-by-step deployment guide for Dev Forge backend services.

**Target Environment:** Production  
**Deployment Method:** Manual (CI/CD to be implemented)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Preparation
- [ ] Production server provisioned
- [ ] Database server provisioned
- [ ] Domain name configured
- [ ] SSL certificates obtained
- [ ] DNS records configured
- [ ] Environment variables prepared
- [ ] Secrets management configured

### 2. Code Preparation
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Version tagged
- [ ] Changelog updated
- [ ] Documentation updated

### 3. Database Preparation
- [ ] Database backup created
- [ ] Migration scripts tested
- [ ] Rollback plan prepared
- [ ] Database credentials secured

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Server Setup

#### 1.1 Provision Server
```bash
# Example: AWS EC2, DigitalOcean, etc.
# Minimum requirements:
# - 2 CPU cores
# - 4GB RAM
# - 20GB storage
# - Ubuntu 22.04 LTS or similar
```

#### 1.2 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or later)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

#### 1.3 Configure Firewall
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

### Step 2: Database Setup

#### 2.1 Create Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE dev_forge_prod;
CREATE USER dev_forge_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE dev_forge_prod TO dev_forge_user;
\q
```

#### 2.2 Configure PostgreSQL
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set connection limits
max_connections = 100
shared_buffers = 256MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

### Step 3: Application Deployment

#### 3.1 Clone Repository
```bash
# Create application directory
sudo mkdir -p /opt/dev-forge-backend
sudo chown $USER:$USER /opt/dev-forge-backend

# Clone repository
cd /opt/dev-forge-backend
git clone https://github.com/Vado42-chris/xi-io-dev_forge.git .

# Navigate to backend
cd products/dev-forge-backend
```

#### 3.2 Install Dependencies
```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build
```

#### 3.3 Configure Environment
```bash
# Create .env file
nano .env

# Add environment variables:
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://dev_forge_user:password@localhost:5432/dev_forge_prod
JWT_SECRET=your_secure_jwt_secret_here
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
OPENAI_API_KEY=your_openai_api_key
CDN_BASE_URL=https://cdn.example.com
```

#### 3.4 Run Migrations
```bash
# Run database migrations
npm run migrate

# Verify migrations
npm run migrate:status
```

#### 3.5 Start Application
```bash
# Start with PM2
pm2 start dist/index.js --name dev-forge-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

---

### Step 4: Nginx Configuration

#### 4.1 Create Nginx Config
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/dev-forge-backend
```

```nginx
server {
    listen 80;
    server_name api.devforge.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.devforge.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.devforge.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.devforge.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3000/api/automation/health;
        access_log off;
    }
}
```

#### 4.2 Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dev-forge-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### Step 5: SSL Certificate

#### 5.1 Install Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

#### 5.2 Obtain Certificate
```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.devforge.example.com

# Auto-renewal is configured automatically
```

---

### Step 6: Monitoring Setup

#### 6.1 Configure PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### 6.2 Setup Logging
```bash
# Logs are automatically managed by PM2
# View logs:
pm2 logs dev-forge-backend

# View specific log:
pm2 logs dev-forge-backend --lines 100
```

---

### Step 7: Verification

#### 7.1 Health Check
```bash
# Check application health
curl https://api.devforge.example.com/api/automation/health

# Expected response:
# {
#   "overall": "healthy",
#   "services": [...]
# }
```

#### 7.2 Integration Validation
```bash
# Run integration validation
curl -X POST https://api.devforge.example.com/api/integration/validate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected response:
# {
#   "overallStatus": "healthy",
#   "checks": [...]
# }
```

#### 7.3 Test Endpoints
```bash
# Test authentication
curl -X POST https://api.devforge.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"Test User"}'

# Test extensions endpoint
curl https://api.devforge.example.com/api/extensions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 ROLLBACK PROCEDURE

### If Deployment Fails

#### 1. Stop Application
```bash
pm2 stop dev-forge-backend
```

#### 2. Rollback Database
```bash
# Restore from backup
sudo -u postgres psql dev_forge_prod < backup.sql

# Or rollback specific migration
npm run migrate:rollback
```

#### 3. Rollback Code
```bash
# Checkout previous version
git checkout <previous-tag>

# Rebuild and restart
npm run build
pm2 restart dev-forge-backend
```

---

## 📊 POST-DEPLOYMENT

### 1. Monitor Application
```bash
# Monitor with PM2
pm2 monit

# Check status
pm2 status

# View logs
pm2 logs dev-forge-backend
```

### 2. Monitor Database
```bash
# Connect to database
sudo -u postgres psql dev_forge_prod

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Monitor Nginx
```bash
# Check Nginx status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 SECURITY CHECKLIST

- [ ] JWT secret changed from default
- [ ] Database password is strong
- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Firewall configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS policies configured
- [ ] Environment variables secured
- [ ] Backup strategy implemented

---

## 📝 MAINTENANCE

### Daily
- [ ] Check application logs
- [ ] Monitor system resources
- [ ] Review error rates

### Weekly
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Review security alerts

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize database
- [ ] Security audit
- [ ] Backup verification

---

## 🆘 TROUBLESHOOTING

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs dev-forge-backend --err

# Check application status
pm2 status

# Restart application
pm2 restart dev-forge-backend
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
sudo -u postgres psql -c "SELECT version();"

# Check connection string in .env
cat .env | grep DATABASE_URL
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📚 ADDITIONAL RESOURCES

- [Production Readiness Guide](./PRODUCTION_READINESS_GUIDE.md)
- [Launch Checklist](./LAUNCH_CHECKLIST.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**#this-is-the-way #so-say-we-all #hallbergstrong**

**Last Updated:** January 12, 2025

