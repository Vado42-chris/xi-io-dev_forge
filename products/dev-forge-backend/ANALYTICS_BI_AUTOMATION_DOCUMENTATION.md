# Analytics & BI Automation Documentation

## Overview

The Analytics & BI Automation system provides comprehensive analytics tracking, business intelligence, metrics collection, and automated reporting for Dev Forge.

## Architecture

### Services

1. **Analytics Automation Service** (`analyticsAutomationService.ts`)
   - Event tracking and storage
   - Event aggregation and counting
   - User activity metrics
   - Event retrieval and filtering

2. **Business Intelligence Service** (`businessIntelligenceService.ts`)
   - Dashboard data generation
   - KPI calculation
   - Business insights generation
   - Revenue, user, and engagement analytics

3. **Metrics Collection Service** (`metricsCollectionService.ts`)
   - Metric definition registration
   - Automated metric collection
   - Time series data retrieval
   - Metric retention management

4. **Reporting Automation Service** (`reportingAutomationService.ts`)
   - Report definition management
   - Scheduled report generation
   - Report distribution
   - Report history tracking

## API Endpoints

### Analytics Events

#### POST `/api/analytics/events`
Track an analytics event.

**Authentication:** Required (Authenticated User)

**Request Body:**
```json
{
  "eventType": "extension.downloaded",
  "properties": {
    "extensionId": "uuid",
    "version": "1.0.0"
  },
  "sessionId": "session-id"
}
```

**Response:**
```json
{
  "id": "uuid",
  "eventType": "extension.downloaded",
  "userId": "uuid",
  "sessionId": "session-id",
  "properties": { ... },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### GET `/api/analytics/events/:eventType`
Get events by type.

**Authentication:** Required (Authenticated User)

**Query Parameters:**
- `limit` (optional): Number of events to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### GET `/api/analytics/events/:eventType/count`
Get event count for a type.

**Authentication:** Required (Authenticated User)

**Query Parameters:**
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

### Metrics

#### POST `/api/analytics/metrics`
Record a metric.

**Authentication:** Required (Authenticated User)

**Request Body:**
```json
{
  "metricName": "api.response_time",
  "value": 150,
  "metricType": "gauge",
  "tags": {
    "endpoint": "/api/extensions",
    "method": "GET"
  }
}
```

#### POST `/api/analytics/metrics/register`
Register a metric definition (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "api.response_time",
  "type": "gauge",
  "description": "API response time in milliseconds",
  "unit": "ms",
  "tags": ["api", "performance"],
  "enabled": true,
  "collectionInterval": 60,
  "retentionPeriod": 90
}
```

#### GET `/api/analytics/metrics`
Get all registered metrics.

**Authentication:** Required (Authenticated User)

#### GET `/api/analytics/metrics/:metricName/timeseries`
Get metric time series data.

**Authentication:** Required (Authenticated User)

**Query Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date
- `granularity` (optional): `minute`, `hour`, `day`, `week`, `month` (default: `hour`)

### Dashboard & Insights

#### GET `/api/analytics/dashboard`
Get dashboard data (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "kpis": [
    {
      "name": "Total Revenue",
      "value": 100000,
      "target": 110000,
      "trend": "up",
      "change": 15.5
    }
  ],
  "revenue": { ... },
  "users": { ... },
  "extensions": { ... },
  "engagement": { ... },
  "topExtensions": [ ... ],
  "topDevelopers": [ ... ]
}
```

#### GET `/api/analytics/insights`
Get business insights (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (required): Start date
- `endDate` (required): End date

### Reports

#### POST `/api/analytics/reports`
Create a report definition (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Monthly Financial Report",
  "type": "financial",
  "template": "financial_monthly",
  "schedule": {
    "frequency": "monthly",
    "dayOfMonth": 1,
    "time": "09:00",
    "timezone": "UTC"
  },
  "recipients": ["admin@example.com"],
  "format": "pdf",
  "enabled": true
}
```

#### GET `/api/analytics/reports`
Get all report definitions (Admin only).

**Authentication:** Required (Admin)

#### POST `/api/analytics/reports/:reportId/generate`
Generate a report (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "format": "pdf"
}
```

#### GET `/api/analytics/reports/generated`
Get generated reports (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `reportDefinitionId` (optional): Filter by report definition
- `limit` (optional): Number of reports (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### POST `/api/analytics/reports/process-scheduled`
Process scheduled reports (Admin only).

**Authentication:** Required (Admin)

## Database Schema

### analytics_events
- `id` (UUID): Primary key
- `event_type` (VARCHAR): Event type identifier
- `user_id` (UUID): User reference (nullable)
- `session_id` (VARCHAR): Session identifier (nullable)
- `properties` (JSONB): Event properties
- `metadata` (JSONB): Additional metadata
- `timestamp` (TIMESTAMP): Event timestamp
- `created_at` (TIMESTAMP): Creation timestamp

### analytics_metrics
- `id` (UUID): Primary key
- `metric_name` (VARCHAR): Metric name
- `metric_value` (NUMERIC): Metric value
- `metric_type` (VARCHAR): Metric type (`counter`, `gauge`, `histogram`, `summary`)
- `tags` (JSONB): Metric tags
- `timestamp` (TIMESTAMP): Metric timestamp
- `created_at` (TIMESTAMP): Creation timestamp

### metric_definitions
- `id` (VARCHAR): Primary key
- `name` (VARCHAR): Metric name (unique)
- `type` (VARCHAR): Metric type
- `description` (TEXT): Metric description
- `unit` (VARCHAR): Metric unit
- `tags` (JSONB): Default tags
- `enabled` (BOOLEAN): Whether metric is enabled
- `collection_interval` (INTEGER): Collection interval in seconds
- `retention_period` (INTEGER): Retention period in days
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Update timestamp

### report_definitions
- `id` (UUID): Primary key
- `name` (VARCHAR): Report name
- `type` (VARCHAR): Report type (`financial`, `analytics`, `user`, `extension`, `custom`)
- `template` (VARCHAR): Report template identifier
- `schedule` (JSONB): Report schedule
- `recipients` (JSONB): Report recipients
- `format` (VARCHAR): Report format (`pdf`, `csv`, `json`, `html`)
- `enabled` (BOOLEAN): Whether report is enabled
- `parameters` (JSONB): Report parameters
- `created_at` (TIMESTAMP): Creation timestamp
- `last_run_at` (TIMESTAMP): Last run timestamp
- `next_run_at` (TIMESTAMP): Next run timestamp

### generated_reports
- `id` (UUID): Primary key
- `report_definition_id` (UUID): Report definition reference
- `report_name` (VARCHAR): Report name
- `type` (VARCHAR): Report type
- `period_start` (TIMESTAMP): Period start
- `period_end` (TIMESTAMP): Period end
- `format` (VARCHAR): Report format
- `data` (JSONB): Report data
- `file_url` (VARCHAR): Generated file URL
- `generated_at` (TIMESTAMP): Generation timestamp
- `generated_by` (UUID): User who generated report
- `status` (VARCHAR): Report status (`pending`, `generating`, `completed`, `failed`)
- `error` (TEXT): Error message if failed

## Usage Examples

### Tracking Events

```typescript
import { analyticsAutomationService } from './services/analyticsAutomationService';

// Track an event
await analyticsAutomationService.trackEvent(
  'extension.downloaded',
  {
    extensionId: 'uuid',
    version: '1.0.0',
  },
  'user-id',
  'session-id'
);

// Get event count
const count = await analyticsAutomationService.getEventCount(
  'extension.downloaded',
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Collecting Metrics

```typescript
import { metricsCollectionService } from './services/metricsCollectionService';

// Register a metric
await metricsCollectionService.registerMetric({
  name: 'api.response_time',
  type: 'gauge',
  description: 'API response time',
  unit: 'ms',
  tags: ['api', 'performance'],
  enabled: true,
  collectionInterval: 60,
  retentionPeriod: 90,
});

// Collect a metric
await metricsCollectionService.collectMetric(
  'api.response_time',
  150,
  { endpoint: '/api/extensions', method: 'GET' }
);

// Get time series
const timeSeries = await metricsCollectionService.getMetricTimeSeries(
  'api.response_time',
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'hour'
);
```

### Generating Dashboard Data

```typescript
import { businessIntelligenceService } from './services/businessIntelligenceService';

const dashboard = await businessIntelligenceService.generateDashboardData(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

const insights = await businessIntelligenceService.generateInsights(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Automated Reporting

```typescript
import { reportingAutomationService } from './services/reportingAutomationService';

// Create a report definition
const report = await reportingAutomationService.createReportDefinition({
  name: 'Monthly Financial Report',
  type: 'financial',
  template: 'financial_monthly',
  schedule: {
    frequency: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
  },
  recipients: ['admin@example.com'],
  format: 'pdf',
  enabled: true,
});

// Generate a report
const generated = await reportingAutomationService.generateReport(
  report.id,
  {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  },
  'pdf'
);

// Process scheduled reports
const scheduled = await reportingAutomationService.processScheduledReports();
```

## Configuration

### Environment Variables

- `ANALYTICS_RETENTION_DAYS`: Default retention period for analytics data (default: 90)
- `METRICS_CLEANUP_INTERVAL`: Interval for cleaning up old metrics (default: 24 hours)
- `REPORT_STORAGE_PATH`: Path for storing generated reports
- `REPORT_EMAIL_FROM`: Email address for sending reports

## Scheduled Tasks

### Metrics Cleanup
Run periodically to clean up old metrics based on retention periods:

```typescript
await metricsCollectionService.cleanupOldMetrics();
```

### Scheduled Reports
Process scheduled reports:

```typescript
await reportingAutomationService.processScheduledReports();
```

## Testing

Run tests with:

```bash
npm test -- analytics
```

## Future Enhancements

1. **Real-time Analytics**: WebSocket-based real-time analytics updates
2. **Advanced Visualizations**: Integration with visualization libraries
3. **Machine Learning**: Predictive analytics and anomaly detection
4. **Export Functionality**: Export dashboards and reports to various formats
5. **Custom Dashboards**: User-configurable dashboards
6. **Alerting**: Automated alerts based on metrics and KPIs
7. **Data Warehousing**: Integration with data warehouses for long-term storage

