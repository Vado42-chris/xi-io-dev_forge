/**
 * Initial Schema Migration
 * 
 * Creates all initial database tables.
 */

import { Migration } from './migrationRunner';

export const migration: Migration = {
  id: '001_initial_schema',
  name: 'Initial Schema',
  up: `
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    );

    -- Licenses Table
    CREATE TABLE IF NOT EXISTS licenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Extensions Table
    CREATE TABLE IF NOT EXISTS extensions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL,
        author_id UUID REFERENCES users(id),
        category VARCHAR(100),
        tags TEXT[],
        price DECIMAL(10, 2) DEFAULT 0.00,
        is_free BOOLEAN DEFAULT TRUE,
        download_count INTEGER DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Extension Reviews Table
    CREATE TABLE IF NOT EXISTS extension_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(extension_id, user_id)
    );

    -- Support Tickets Table
    CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        assigned_to UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
    );

    -- Support Ticket Messages Table
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Analytics Events Table
    CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Developer Applications Table
    CREATE TABLE IF NOT EXISTS developer_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        application_data JSONB,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
    CREATE INDEX IF NOT EXISTS idx_extensions_slug ON extensions(slug);
    CREATE INDEX IF NOT EXISTS idx_extensions_status ON extensions(status);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
  `,
  down: `
    DROP TABLE IF EXISTS developer_applications;
    DROP TABLE IF EXISTS analytics_events;
    DROP TABLE IF EXISTS support_ticket_messages;
    DROP TABLE IF EXISTS support_tickets;
    DROP TABLE IF EXISTS extension_reviews;
    DROP TABLE IF EXISTS extensions;
    DROP TABLE IF EXISTS licenses;
    DROP TABLE IF EXISTS users;
  `
};

