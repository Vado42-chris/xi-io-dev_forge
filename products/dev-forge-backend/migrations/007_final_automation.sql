-- Final Automation Migration
-- Creates tables for health monitoring, performance optimization, and security automation

-- Health Checks Table
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_status VARCHAR(50) NOT NULL,
  services_data JSONB NOT NULL,
  metrics_data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Health Alerts Table
CREATE TABLE IF NOT EXISTS health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  endpoint VARCHAR(500),
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Performance Optimizations Table
CREATE TABLE IF NOT EXISTS performance_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_type VARCHAR(50) NOT NULL,
  target VARCHAR(255) NOT NULL,
  before_value NUMERIC NOT NULL,
  after_value NUMERIC NOT NULL,
  improvement NUMERIC NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP,
  error TEXT
);

-- Cache Strategies Table
CREATE TABLE IF NOT EXISTS cache_strategies (
  key VARCHAR(255) PRIMARY KEY,
  ttl INTEGER NOT NULL,
  tags JSONB,
  invalidation_rules JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Security Scans Table
CREATE TABLE IF NOT EXISTS security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type VARCHAR(50) NOT NULL,
  target VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  findings JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT
);

-- Compliance Checks Table
CREATE TABLE IF NOT EXISTS compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]',
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  next_check_at TIMESTAMP NOT NULL
);

-- Security Audits Table
CREATE TABLE IF NOT EXISTS security_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type VARCHAR(50) NOT NULL,
  scope JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  findings JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  auditor UUID REFERENCES users(id) ON DELETE SET NULL,
  error TEXT
);

-- Indexes for health_checks
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(overall_status);

-- Indexes for health_alerts
CREATE INDEX IF NOT EXISTS idx_health_alerts_service ON health_alerts(service_name);
CREATE INDEX IF NOT EXISTS idx_health_alerts_status ON health_alerts(status);
CREATE INDEX IF NOT EXISTS idx_health_alerts_severity ON health_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_health_alerts_created_at ON health_alerts(created_at DESC);

-- Indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);

-- Indexes for performance_optimizations
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_type ON performance_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_status ON performance_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_performance_optimizations_applied_at ON performance_optimizations(applied_at DESC);

-- Indexes for security_scans
CREATE INDEX IF NOT EXISTS idx_security_scans_type ON security_scans(scan_type);
CREATE INDEX IF NOT EXISTS idx_security_scans_status ON security_scans(status);
CREATE INDEX IF NOT EXISTS idx_security_scans_started_at ON security_scans(started_at DESC);

-- Indexes for compliance_checks
CREATE INDEX IF NOT EXISTS idx_compliance_checks_standard ON compliance_checks(standard);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_checked_at ON compliance_checks(checked_at DESC);

-- Indexes for security_audits
CREATE INDEX IF NOT EXISTS idx_security_audits_type ON security_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_security_audits_status ON security_audits(status);
CREATE INDEX IF NOT EXISTS idx_security_audits_started_at ON security_audits(started_at DESC);

