# Financial Automation Documentation

## Overview

The Financial Automation system provides comprehensive revenue sharing, payout processing, tax reporting, and financial analytics for the Dev Forge extension marketplace.

## Architecture

### Services

1. **Revenue Sharing Service** (`revenueSharingService.ts`)
   - Calculates revenue splits between developers and platform
   - Tracks revenue shares by transaction
   - Manages payout summaries

2. **Payout Automation Service** (`payoutAutomationService.ts`)
   - Automates payout processing for developers
   - Supports multiple payment methods (Stripe, PayPal, Bank Transfer)
   - Handles payout scheduling and thresholds

3. **Tax Reporting Service** (`taxReportingService.ts`)
   - Generates tax reports for developers
   - Creates tax forms (1099-NEC, 1099-MISC, W-9, W-8BEN)
   - Calculates tax withholding

4. **Financial Reporting Service** (`financialReportingService.ts`)
   - Generates comprehensive financial reports
   - Provides analytics and trends
   - Tracks top performers

## API Endpoints

### Revenue Shares

#### GET `/api/financial/revenue-shares`
Get developer's revenue shares.

**Authentication:** Required (Developer)

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `processed`, `paid`, `failed`)
- `startDate` (optional): Filter by period start
- `endDate` (optional): Filter by period end

**Response:**
```json
[
  {
    "id": "uuid",
    "extensionId": "uuid",
    "developerId": "uuid",
    "transactionId": "string",
    "amount": 10000,
    "platformFee": 30,
    "developerShare": 7000,
    "platformShare": 3000,
    "status": "pending",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-01-31T23:59:59Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

#### POST `/api/financial/revenue-shares`
Record a revenue share (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "extensionId": "uuid",
  "transactionId": "string",
  "amount": 10000,
  "platformFeePercentage": 30,
  "periodStart": "2024-01-01T00:00:00Z",
  "periodEnd": "2024-01-31T23:59:59Z"
}
```

### Payouts

#### POST `/api/financial/payouts/process`
Process automatic payouts (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "schedule": {
    "frequency": "monthly",
    "dayOfMonth": 1,
    "minimumAmount": 10000
  }
}
```

### Tax Reporting

#### GET `/api/financial/tax-report`
Get tax report for developer.

**Authentication:** Required (Developer)

**Query Parameters:**
- `year` (required): Tax year
- `quarter` (optional): Quarter (1-4)

**Response:**
```json
{
  "id": "tax-report-id",
  "developerId": "uuid",
  "year": 2024,
  "quarter": 1,
  "totalRevenue": 100000,
  "totalPayouts": 70000,
  "platformFees": 30000,
  "taxWithheld": 10500,
  "taxRate": 15,
  "netEarnings": 59500,
  "status": "draft",
  "generatedAt": "2024-01-15T10:00:00Z"
}
```

#### POST `/api/financial/tax-form`
Generate tax form for developer.

**Authentication:** Required (Developer)

**Request Body:**
```json
{
  "year": 2024,
  "formType": "1099-NEC"
}
```

### Financial Reports

#### GET `/api/financial/report`
Get financial report (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (required): Report start date
- `endDate` (required): Report end date

#### GET `/api/financial/developer-summary/:developerId?`
Get developer financial summary.

**Authentication:** Required (Developer or Admin)

**Query Parameters:**
- `startDate` (required): Summary start date
- `endDate` (required): Summary end date

#### GET `/api/financial/revenue-trends`
Get revenue trends (Admin only).

**Authentication:** Required (Admin)

**Query Parameters:**
- `startDate` (required): Trend start date
- `endDate` (required): Trend end date
- `granularity` (optional): `daily`, `weekly`, or `monthly` (default: `monthly`)

## Database Schema

### revenue_shares
- `id` (UUID): Primary key
- `extension_id` (UUID): Extension reference
- `developer_id` (UUID): Developer reference
- `transaction_id` (VARCHAR): Transaction identifier
- `amount` (INTEGER): Total amount in cents
- `platform_fee` (INTEGER): Platform fee percentage
- `developer_share` (INTEGER): Developer share in cents
- `platform_share` (INTEGER): Platform share in cents
- `status` (VARCHAR): Status (`pending`, `processed`, `paid`, `failed`)
- `period_start` (TIMESTAMP): Period start
- `period_end` (TIMESTAMP): Period end
- `created_at` (TIMESTAMP): Creation timestamp
- `processed_at` (TIMESTAMP): Processing timestamp
- `paid_at` (TIMESTAMP): Payment timestamp

### payout_requests
- `id` (UUID): Primary key
- `developer_id` (UUID): Developer reference
- `amount` (INTEGER): Payout amount in cents
- `currency` (VARCHAR): Currency code
- `payment_method` (VARCHAR): Payment method
- `payment_details` (JSONB): Payment details
- `status` (VARCHAR): Status (`pending`, `processing`, `completed`, `failed`)
- `requested_at` (TIMESTAMP): Request timestamp
- `processed_at` (TIMESTAMP): Processing timestamp
- `failure_reason` (TEXT): Failure reason if failed

### tax_reports
- `id` (VARCHAR): Primary key
- `developer_id` (UUID): Developer reference
- `year` (INTEGER): Tax year
- `quarter` (INTEGER): Quarter (1-4, optional)
- `total_revenue` (INTEGER): Total revenue in cents
- `total_payouts` (INTEGER): Total payouts in cents
- `platform_fees` (INTEGER): Platform fees in cents
- `tax_withheld` (INTEGER): Tax withheld in cents
- `tax_rate` (INTEGER): Tax rate percentage
- `net_earnings` (INTEGER): Net earnings in cents
- `status` (VARCHAR): Status (`draft`, `finalized`, `filed`)
- `generated_at` (TIMESTAMP): Generation timestamp
- `finalized_at` (TIMESTAMP): Finalization timestamp
- `report_data` (JSONB): Additional report data

### tax_forms
- `id` (UUID): Primary key
- `type` (VARCHAR): Form type (`1099-NEC`, `1099-MISC`, `W-9`, `W-8BEN`)
- `developer_id` (UUID): Developer reference
- `year` (INTEGER): Tax year
- `form_data` (JSONB): Form data
- `generated_at` (TIMESTAMP): Generation timestamp

### financial_reports
- `id` (VARCHAR): Primary key
- `period_start` (TIMESTAMP): Period start
- `period_end` (TIMESTAMP): Period end
- `revenue_data` (JSONB): Revenue data
- `expense_data` (JSONB): Expense data
- `profit_data` (JSONB): Profit data
- `metrics_data` (JSONB): Metrics data
- `generated_at` (TIMESTAMP): Generation timestamp
- `report_data` (JSONB): Additional report data

## Usage Examples

### Recording a Revenue Share

```typescript
import { revenueSharingService } from './services/revenueSharingService';

const revenueShare = await revenueSharingService.recordRevenueShare(
  'extension-id',
  'developer-id',
  'transaction-id',
  10000, // $100.00 in cents
  30, // 30% platform fee
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Processing Automatic Payouts

```typescript
import { payoutAutomationService } from './services/payoutAutomationService';

const payouts = await payoutAutomationService.processAutomaticPayouts({
  frequency: 'monthly',
  dayOfMonth: 1,
  minimumAmount: 10000, // $100.00 minimum
});
```

### Generating a Tax Report

```typescript
import { taxReportingService } from './services/taxReportingService';

const report = await taxReportingService.generateTaxReport(
  'developer-id',
  2024,
  1 // Q1
);
```

### Generating a Financial Report

```typescript
import { financialReportingService } from './services/financialReportingService';

const report = await financialReportingService.generateFinancialReport(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
```

## Configuration

### Environment Variables

- `PLATFORM_FEE_PERCENTAGE`: Default platform fee percentage (default: 30)
- `MIN_PAYOUT_THRESHOLD`: Minimum payout amount in cents (default: 10000 = $100.00)
- `PAYOUT_FREQUENCY`: Payout frequency (`daily`, `weekly`, `monthly`)
- `COMPANY_EIN`: Company EIN for tax forms

## Testing

Run tests with:

```bash
npm test -- financial
```

## Future Enhancements

1. **Multi-currency Support**: Support for multiple currencies
2. **Advanced Tax Calculation**: Integration with tax calculation services
3. **Payment Provider Integration**: Full integration with Stripe Connect, PayPal, etc.
4. **Automated Tax Filing**: Integration with tax filing services
5. **Real-time Analytics**: WebSocket-based real-time financial updates
6. **Export Functionality**: Export reports to PDF, CSV, Excel

