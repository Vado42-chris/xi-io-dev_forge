-- Week 18 Services Migration
-- Creates tables for security audit reports and UAT test plans

-- Security Audit Reports Table
CREATE TABLE IF NOT EXISTS security_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type VARCHAR(50) NOT NULL,
  scope JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  findings JSONB NOT NULL DEFAULT '[]',
  risk_score INTEGER NOT NULL DEFAULT 0,
  compliance_status JSONB NOT NULL DEFAULT '{}',
  recommendations JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  auditor UUID REFERENCES users(id) ON DELETE SET NULL
);

-- UAT Test Plans Table
CREATE TABLE IF NOT EXISTS uat_test_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scenarios JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for security_audit_reports
CREATE INDEX IF NOT EXISTS idx_security_audit_reports_type ON security_audit_reports(audit_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_reports_status ON security_audit_reports(status);
CREATE INDEX IF NOT EXISTS idx_security_audit_reports_started_at ON security_audit_reports(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_reports_risk_score ON security_audit_reports(risk_score DESC);

-- Indexes for uat_test_plans
CREATE INDEX IF NOT EXISTS idx_uat_test_plans_status ON uat_test_plans(status);
CREATE INDEX IF NOT EXISTS idx_uat_test_plans_created_by ON uat_test_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_uat_test_plans_created_at ON uat_test_plans(created_at DESC);

