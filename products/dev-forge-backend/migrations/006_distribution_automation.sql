-- Distribution Automation Migration
-- Creates tables for CDN, version management, updates, and rollbacks

-- CDN Files Table
CREATE TABLE IF NOT EXISTS cdn_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  cdn_url VARCHAR(500) NOT NULL,
  cache_control VARCHAR(255),
  expires_at TIMESTAMP,
  metadata JSONB,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- CDN Distributions Table
CREATE TABLE IF NOT EXISTS cdn_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES cdn_files(id) ON DELETE CASCADE,
  distribution_url VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  regions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT
);

-- Versions Table
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  patch INTEGER NOT NULL,
  prerelease VARCHAR(100),
  build VARCHAR(100),
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  product_id UUID,
  changelog TEXT,
  release_notes TEXT,
  is_stable BOOLEAN NOT NULL DEFAULT true,
  is_deprecated BOOLEAN NOT NULL DEFAULT false,
  released_at TIMESTAMP NOT NULL DEFAULT NOW(),
  released_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB
);

-- Update Packages Table
CREATE TABLE IF NOT EXISTS update_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version VARCHAR(50) NOT NULL,
  to_version VARCHAR(50) NOT NULL,
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  product_id UUID,
  package_url VARCHAR(500) NOT NULL,
  package_size BIGINT NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  is_delta BOOLEAN NOT NULL DEFAULT false,
  delta_from_version VARCHAR(50),
  release_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  distributed_at TIMESTAMP
);

-- Update Distributions Table
CREATE TABLE IF NOT EXISTS update_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_package_id UUID NOT NULL REFERENCES update_packages(id) ON DELETE CASCADE,
  distribution_strategy VARCHAR(50) NOT NULL DEFAULT 'gradual',
  target_users JSONB,
  target_percentage INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);

-- Update Notifications Table
CREATE TABLE IF NOT EXISTS update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_package_id UUID NOT NULL REFERENCES update_packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'available',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error TEXT
);

-- Rollback Plans Table
CREATE TABLE IF NOT EXISTS rollback_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version VARCHAR(50) NOT NULL,
  to_version VARCHAR(50) NOT NULL,
  extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
  product_id UUID,
  reason TEXT NOT NULL,
  safety_checks JSONB NOT NULL DEFAULT '[]',
  estimated_downtime INTEGER,
  rollback_strategy VARCHAR(50) NOT NULL DEFAULT 'immediate',
  scheduled_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  executed_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);

-- Rollback Executions Table
CREATE TABLE IF NOT EXISTS rollback_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollback_plan_id UUID NOT NULL REFERENCES rollback_plans(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT,
  affected_users INTEGER NOT NULL DEFAULT 0,
  successful_rollbacks INTEGER NOT NULL DEFAULT 0,
  failed_rollbacks INTEGER NOT NULL DEFAULT 0
);

-- Indexes for cdn_files
CREATE INDEX IF NOT EXISTS idx_cdn_files_uploaded_at ON cdn_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdn_files_uploaded_by ON cdn_files(uploaded_by);

-- Indexes for cdn_distributions
CREATE INDEX IF NOT EXISTS idx_cdn_distributions_file_id ON cdn_distributions(file_id);
CREATE INDEX IF NOT EXISTS idx_cdn_distributions_status ON cdn_distributions(status);

-- Indexes for versions
CREATE INDEX IF NOT EXISTS idx_versions_extension_id ON versions(extension_id);
CREATE INDEX IF NOT EXISTS idx_versions_product_id ON versions(product_id);
CREATE INDEX IF NOT EXISTS idx_versions_version ON versions(version);
CREATE INDEX IF NOT EXISTS idx_versions_major_minor_patch ON versions(major DESC, minor DESC, patch DESC);
CREATE INDEX IF NOT EXISTS idx_versions_is_stable ON versions(is_stable);
CREATE INDEX IF NOT EXISTS idx_versions_released_at ON versions(released_at DESC);

-- Indexes for update_packages
CREATE INDEX IF NOT EXISTS idx_update_packages_from_version ON update_packages(from_version);
CREATE INDEX IF NOT EXISTS idx_update_packages_to_version ON update_packages(to_version);
CREATE INDEX IF NOT EXISTS idx_update_packages_extension_id ON update_packages(extension_id);
CREATE INDEX IF NOT EXISTS idx_update_packages_product_id ON update_packages(product_id);

-- Indexes for update_distributions
CREATE INDEX IF NOT EXISTS idx_update_distributions_package_id ON update_distributions(update_package_id);
CREATE INDEX IF NOT EXISTS idx_update_distributions_status ON update_distributions(status);

-- Indexes for update_notifications
CREATE INDEX IF NOT EXISTS idx_update_notifications_package_id ON update_notifications(update_package_id);
CREATE INDEX IF NOT EXISTS idx_update_notifications_user_id ON update_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_update_notifications_status ON update_notifications(status);

-- Indexes for rollback_plans
CREATE INDEX IF NOT EXISTS idx_rollback_plans_extension_id ON rollback_plans(extension_id);
CREATE INDEX IF NOT EXISTS idx_rollback_plans_status ON rollback_plans(status);
CREATE INDEX IF NOT EXISTS idx_rollback_plans_created_by ON rollback_plans(created_by);

-- Indexes for rollback_executions
CREATE INDEX IF NOT EXISTS idx_rollback_executions_plan_id ON rollback_executions(rollback_plan_id);
CREATE INDEX IF NOT EXISTS idx_rollback_executions_status ON rollback_executions(status);

