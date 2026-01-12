-- Financial Automation Migration
-- Creates tables for revenue sharing, payouts, tax reporting, and financial reporting

-- Revenue Shares Table
CREATE TABLE IF NOT EXISTS revenue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension_id UUID NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- In cents
  platform_fee INTEGER NOT NULL, -- Fee percentage (e.g., 30 = 30%)
  developer_share INTEGER NOT NULL, -- In cents
  platform_share INTEGER NOT NULL, -- In cents
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  paid_at TIMESTAMP
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- In cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  failure_reason TEXT
);

-- Tax Reports Table
CREATE TABLE IF NOT EXISTS tax_reports (
  id VARCHAR(255) PRIMARY KEY,
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  total_payouts INTEGER NOT NULL DEFAULT 0,
  platform_fees INTEGER NOT NULL DEFAULT 0,
  tax_withheld INTEGER NOT NULL DEFAULT 0,
  tax_rate INTEGER NOT NULL DEFAULT 0,
  net_earnings INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMP,
  report_data JSONB
);

-- Tax Forms Table
CREATE TABLE IF NOT EXISTS tax_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  form_data JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Financial Reports Table
CREATE TABLE IF NOT EXISTS financial_reports (
  id VARCHAR(255) PRIMARY KEY,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  revenue_data JSONB NOT NULL,
  expense_data JSONB NOT NULL,
  profit_data JSONB NOT NULL,
  metrics_data JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  report_data JSONB
);

-- Indexes for revenue_shares
CREATE INDEX IF NOT EXISTS idx_revenue_shares_developer_id ON revenue_shares(developer_id);
CREATE INDEX IF NOT EXISTS idx_revenue_shares_extension_id ON revenue_shares(extension_id);
CREATE INDEX IF NOT EXISTS idx_revenue_shares_status ON revenue_shares(status);
CREATE INDEX IF NOT EXISTS idx_revenue_shares_period ON revenue_shares(period_start, period_end);

-- Indexes for payout_requests
CREATE INDEX IF NOT EXISTS idx_payout_requests_developer_id ON payout_requests(developer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at DESC);

-- Indexes for tax_reports
CREATE INDEX IF NOT EXISTS idx_tax_reports_developer_id ON tax_reports(developer_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_year ON tax_reports(year);
CREATE INDEX IF NOT EXISTS idx_tax_reports_status ON tax_reports(status);

-- Indexes for tax_forms
CREATE INDEX IF NOT EXISTS idx_tax_forms_developer_id ON tax_forms(developer_id);
CREATE INDEX IF NOT EXISTS idx_tax_forms_year ON tax_forms(year);
CREATE INDEX IF NOT EXISTS idx_tax_forms_type ON tax_forms(type);

-- Indexes for financial_reports
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(period_start, period_end);

