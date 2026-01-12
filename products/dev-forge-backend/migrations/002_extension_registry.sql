-- Extension Registry Migration
-- Creates tables for extension submissions and developer applications

-- Extension Submissions Table
CREATE TABLE IF NOT EXISTS extension_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  price INTEGER NOT NULL DEFAULT 0,
  package_url TEXT NOT NULL,
  manifest JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  review_result JSONB,
  review_notes TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Developer Applications Table
CREATE TABLE IF NOT EXISTS developer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  application_data JSONB NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for extension_submissions
CREATE INDEX IF NOT EXISTS idx_extension_submissions_developer_id ON extension_submissions(developer_id);
CREATE INDEX IF NOT EXISTS idx_extension_submissions_status ON extension_submissions(status);
CREATE INDEX IF NOT EXISTS idx_extension_submissions_submitted_at ON extension_submissions(submitted_at DESC);

-- Indexes for developer_applications
CREATE INDEX IF NOT EXISTS idx_developer_applications_user_id ON developer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_applications_status ON developer_applications(status);
CREATE INDEX IF NOT EXISTS idx_developer_applications_submitted_at ON developer_applications(submitted_at DESC);

-- Update trigger for extension_submissions
CREATE OR REPLACE FUNCTION update_extension_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_extension_submissions_updated_at
  BEFORE UPDATE ON extension_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_extension_submissions_updated_at();

-- Update trigger for developer_applications
CREATE OR REPLACE FUNCTION update_developer_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_developer_applications_updated_at
  BEFORE UPDATE ON developer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_developer_applications_updated_at();

