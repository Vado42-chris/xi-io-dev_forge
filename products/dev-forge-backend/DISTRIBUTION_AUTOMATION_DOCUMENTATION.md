# Distribution Automation Documentation

## Overview

The Distribution Automation system provides CDN integration, version management, update distribution, and rollback automation for Dev Forge.

## Architecture

### Services

1. **CDN Integration Service** (`cdnIntegrationService.ts`)
   - File upload to CDN
   - Cache management and invalidation
   - Multi-region distribution
   - File statistics and analytics

2. **Version Management Service** (`versionManagementService.ts`)
   - Semantic versioning
   - Version comparison
   - Changelog generation
   - Version deprecation

3. **Update Distribution Service** (`updateDistributionService.ts`)
   - Update package creation
   - Distribution strategies (immediate, gradual, scheduled)
   - Update notifications
   - Delta updates

4. **Rollback Automation Service** (`rollbackAutomationService.ts`)
   - Rollback plan creation
   - Safety checks
   - Rollback execution
   - Recovery management

## API Endpoints

### CDN

#### POST `/api/distribution/cdn/upload`
Upload file to CDN (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "filePath": "/path/to/file",
  "fileName": "file.zip",
  "cacheControl": "public, max-age=31536000",
  "expiresAt": "2025-12-31T23:59:59Z",
  "metadata": {
    "category": "extension",
    "version": "1.0.0"
  }
}
```

#### GET `/api/distribution/cdn/files/:fileId`
Get CDN file information.

**Authentication:** Required (Authenticated User)

#### DELETE `/api/distribution/cdn/files/:fileId`
Delete file from CDN (Admin only).

**Authentication:** Required (Admin)

#### POST `/api/distribution/cdn/files/:fileId/invalidate`
Invalidate CDN cache (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "paths": ["/path/to/invalidate"]
}
```

### Versions

#### POST `/api/distribution/versions`
Create a new version (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "version": "1.2.3",
  "extensionId": "uuid",
  "changelog": [
    {
      "type": "added",
      "description": "New feature",
      "scope": "ui"
    }
  ],
  "releaseNotes": "Release notes here"
}
```

#### GET `/api/distribution/versions`
Get versions.

**Authentication:** Required (Authenticated User)

**Query Parameters:**
- `extensionId` (optional): Filter by extension
- `productId` (optional): Filter by product
- `includePrerelease` (optional): Include prerelease versions

#### GET `/api/distribution/versions/latest`
Get latest version.

**Authentication:** Required (Authenticated User)

#### GET `/api/distribution/versions/:versionId`
Get version by ID.

**Authentication:** Required (Authenticated User)

#### POST `/api/distribution/versions/compare`
Compare two versions.

**Authentication:** Required (Authenticated User)

**Request Body:**
```json
{
  "version1": "1.2.3",
  "version2": "1.2.4"
}
```

### Updates

#### POST `/api/distribution/updates/check`
Check for available updates.

**Authentication:** Required (Authenticated User)

**Request Body:**
```json
{
  "currentVersion": "1.0.0",
  "extensionId": "uuid"
}
```

#### POST `/api/distribution/updates/packages`
Create update package (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "fromVersion": "1.0.0",
  "toVersion": "1.1.0",
  "packagePath": "/path/to/package.zip",
  "extensionId": "uuid",
  "isDelta": false,
  "releaseNotes": "Update notes"
}
```

### Rollbacks

#### POST `/api/distribution/rollbacks/plans`
Create rollback plan (Admin only).

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "fromVersion": "1.1.0",
  "toVersion": "1.0.0",
  "reason": "Critical bug in 1.1.0",
  "extensionId": "uuid",
  "rollbackStrategy": "immediate"
}
```

#### POST `/api/distribution/rollbacks/plans/:planId/approve`
Approve rollback plan (Admin only).

**Authentication:** Required (Admin)

#### POST `/api/distribution/rollbacks/plans/:planId/execute`
Execute rollback (Admin only).

**Authentication:** Required (Admin)

## Database Schema

### cdn_files
- `id` (UUID): Primary key
- `file_name` (VARCHAR): File name
- `file_path` (VARCHAR): Local file path
- `file_size` (BIGINT): File size in bytes
- `mime_type` (VARCHAR): MIME type
- `cdn_url` (VARCHAR): CDN URL
- `cache_control` (VARCHAR): Cache control header
- `expires_at` (TIMESTAMP): Expiration timestamp
- `metadata` (JSONB): Additional metadata
- `uploaded_at` (TIMESTAMP): Upload timestamp
- `uploaded_by` (UUID): User who uploaded

### versions
- `id` (UUID): Primary key
- `version` (VARCHAR): Semantic version
- `major` (INTEGER): Major version number
- `minor` (INTEGER): Minor version number
- `patch` (INTEGER): Patch version number
- `prerelease` (VARCHAR): Prerelease identifier
- `build` (VARCHAR): Build identifier
- `extension_id` (UUID): Extension reference
- `product_id` (UUID): Product reference
- `changelog` (TEXT): Changelog
- `release_notes` (TEXT): Release notes
- `is_stable` (BOOLEAN): Whether version is stable
- `is_deprecated` (BOOLEAN): Whether version is deprecated
- `released_at` (TIMESTAMP): Release timestamp
- `released_by` (UUID): User who released
- `metadata` (JSONB): Additional metadata

### update_packages
- `id` (UUID): Primary key
- `from_version` (VARCHAR): Source version
- `to_version` (VARCHAR): Target version
- `extension_id` (UUID): Extension reference
- `product_id` (UUID): Product reference
- `package_url` (VARCHAR): Package CDN URL
- `package_size` (BIGINT): Package size in bytes
- `checksum` (VARCHAR): Package checksum
- `is_delta` (BOOLEAN): Whether package is delta update
- `delta_from_version` (VARCHAR): Delta source version
- `release_notes` (TEXT): Release notes
- `created_at` (TIMESTAMP): Creation timestamp
- `distributed_at` (TIMESTAMP): Distribution timestamp

### rollback_plans
- `id` (UUID): Primary key
- `from_version` (VARCHAR): Current version
- `to_version` (VARCHAR): Target version
- `extension_id` (UUID): Extension reference
- `product_id` (UUID): Product reference
- `reason` (TEXT): Rollback reason
- `safety_checks` (JSONB): Safety check results
- `estimated_downtime` (INTEGER): Estimated downtime in seconds
- `rollback_strategy` (VARCHAR): Rollback strategy
- `scheduled_at` (TIMESTAMP): Scheduled execution time
- `status` (VARCHAR): Plan status
- `created_by` (UUID): User who created
- `approved_by` (UUID): User who approved
- `created_at` (TIMESTAMP): Creation timestamp
- `executed_at` (TIMESTAMP): Execution timestamp
- `completed_at` (TIMESTAMP): Completion timestamp
- `error` (TEXT): Error message if failed

## Usage Examples

### Creating a Version

```typescript
import { versionManagementService } from './services/versionManagementService';

const version = await versionManagementService.createVersion(
  '1.2.3',
  'extension-id',
  undefined,
  [
    {
      type: 'added',
      description: 'New feature',
      scope: 'ui',
    },
    {
      type: 'fixed',
      description: 'Bug fix',
      breaking: false,
    },
  ],
  'Release notes here'
);
```

### Checking for Updates

```typescript
import { updateDistributionService } from './services/updateDistributionService';

const update = await updateDistributionService.checkForUpdates(
  '1.0.0',
  'extension-id'
);

if (update) {
  console.log(`Update available: ${update.toVersion}`);
}
```

### Creating a Rollback Plan

```typescript
import { rollbackAutomationService } from './services/rollbackAutomationService';

const plan = await rollbackAutomationService.createRollbackPlan(
  '1.1.0',
  '1.0.0',
  'Critical bug in 1.1.0',
  'extension-id',
  undefined,
  'immediate',
  undefined,
  'admin-id'
);

// Approve and execute
await rollbackAutomationService.approveRollbackPlan(plan.id, 'admin-id');
await rollbackAutomationService.executeRollback(plan.id);
```

## Configuration

### Environment Variables

- `CDN_PROVIDER`: CDN provider (e.g., 'cloudflare', 'cloudfront')
- `CDN_BASE_URL`: Base URL for CDN
- `CDN_API_KEY`: CDN API key
- `UPLOAD_DIR`: Directory for file uploads
- `MAX_FILE_SIZE`: Maximum file size in bytes

## Testing

Run tests with:

```bash
npm test -- distribution
```

## Future Enhancements

1. **Actual CDN Integration**: Full integration with Cloudflare, AWS CloudFront, etc.
2. **Delta Updates**: Efficient delta update generation
3. **A/B Testing**: A/B testing for updates
4. **Canary Releases**: Gradual rollout with monitoring
5. **Automatic Rollback**: Automatic rollback on error detection
6. **Update Analytics**: Detailed analytics on update adoption
7. **Multi-Format Support**: Support for different package formats

