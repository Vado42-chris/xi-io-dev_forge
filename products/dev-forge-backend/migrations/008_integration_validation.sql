-- Integration Validation Migration
-- Creates tables for integration validation and testing

-- Integration Reports Table
CREATE TABLE IF NOT EXISTS integration_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_status VARCHAR(50) NOT NULL,
  checks_data JSONB NOT NULL DEFAULT '[]',
  summary_data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for integration_reports
CREATE INDEX IF NOT EXISTS idx_integration_reports_timestamp ON integration_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_integration_reports_status ON integration_reports(overall_status);

