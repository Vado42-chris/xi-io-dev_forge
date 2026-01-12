-- Analytics Automation Migration
-- Creates tables for analytics events, metrics, BI, and reporting

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  properties JSONB NOT NULL DEFAULT '{}',
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Analytics Metrics Table
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type VARCHAR(50) NOT NULL DEFAULT 'gauge',
  tags JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Metric Definitions Table
CREATE TABLE IF NOT EXISTS metric_definitions (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  tags JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  collection_interval INTEGER, -- In seconds
  retention_period INTEGER, -- In days
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Report Definitions Table
CREATE TABLE IF NOT EXISTS report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  template VARCHAR(255) NOT NULL,
  schedule JSONB,
  recipients JSONB NOT NULL DEFAULT '[]',
  format VARCHAR(50) NOT NULL DEFAULT 'json',
  enabled BOOLEAN NOT NULL DEFAULT true,
  parameters JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP
);

-- Generated Reports Table
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  report_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  format VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  file_url VARCHAR(500),
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  error TEXT
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);

-- Indexes for analytics_metrics
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_metric_name ON analytics_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_timestamp ON analytics_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name_timestamp ON analytics_metrics(metric_name, timestamp DESC);

-- Indexes for metric_definitions
CREATE INDEX IF NOT EXISTS idx_metric_definitions_name ON metric_definitions(name);
CREATE INDEX IF NOT EXISTS idx_metric_definitions_enabled ON metric_definitions(enabled);

-- Indexes for report_definitions
CREATE INDEX IF NOT EXISTS idx_report_definitions_type ON report_definitions(type);
CREATE INDEX IF NOT EXISTS idx_report_definitions_enabled ON report_definitions(enabled);
CREATE INDEX IF NOT EXISTS idx_report_definitions_next_run ON report_definitions(next_run_at) WHERE next_run_at IS NOT NULL;

-- Indexes for generated_reports
CREATE INDEX IF NOT EXISTS idx_generated_reports_definition_id ON generated_reports(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);

