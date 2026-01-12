/**
 * Version Management Service
 * 
 * Automated version management with semantic versioning and changelog generation.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface Version {
  id: string;
  version: string; // Semantic version (e.g., "1.2.3")
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
  extensionId?: string;
  productId?: string;
  changelog: string;
  releaseNotes?: string;
  isStable: boolean;
  isDeprecated: boolean;
  releasedAt: Date;
  releasedBy?: string;
  metadata?: Record<string, any>;
}

export interface VersionComparison {
  version1: string;
  version2: string;
  result: 'greater' | 'equal' | 'less';
  difference: {
    major: number;
    minor: number;
    patch: number;
  };
}

export interface ChangelogEntry {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  scope?: string;
  breaking?: boolean;
}

export const versionManagementService = {
  /**
   * Create a new version
   */
  async createVersion(
    version: string,
    extensionId?: string,
    productId?: string,
    changelog?: ChangelogEntry[],
    releaseNotes?: string,
    metadata?: Record<string, any>
  ): Promise<Version> {
    try {
      // Parse semantic version
      const parsed = this.parseSemanticVersion(version);
      
      const versionId = uuidv4();
      const changelogText = changelog ? this.formatChangelog(changelog) : '';

      await pool.query(
        `INSERT INTO versions 
         (id, version, major, minor, patch, prerelease, build, extension_id, product_id, changelog, release_notes, is_stable, is_deprecated, released_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)`,
        [
          versionId,
          version,
          parsed.major,
          parsed.minor,
          parsed.patch,
          parsed.prerelease || null,
          parsed.build || null,
          extensionId || null,
          productId || null,
          changelogText,
          releaseNotes || null,
          !parsed.prerelease, // Stable if no prerelease
          false,
          metadata ? JSON.stringify(metadata) : null,
        ]
      );

      const versionObj: Version = {
        id: versionId,
        version,
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        prerelease: parsed.prerelease,
        build: parsed.build,
        extensionId,
        productId,
        changelog: changelogText,
        releaseNotes,
        isStable: !parsed.prerelease,
        isDeprecated: false,
        releasedAt: new Date(),
        metadata,
      };

      logger.info(`Version created: ${version}`, { versionId });
      return versionObj;
    } catch (error: any) {
      logger.error(`Error creating version:`, error);
      throw new Error(`Failed to create version: ${error.message}`);
    }
  },

  /**
   * Get version by ID
   */
  async getVersion(versionId: string): Promise<Version | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM versions WHERE id = $1`,
        [versionId]
      );

      if (result.rows.length > 0) {
        return this.mapRowToVersion(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting version:`, error);
      throw new Error(`Failed to get version: ${error.message}`);
    }
  },

  /**
   * Get versions for extension or product
   */
  async getVersions(
    extensionId?: string,
    productId?: string,
    includePrerelease: boolean = false
  ): Promise<Version[]> {
    try {
      let query = `SELECT * FROM versions WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (extensionId) {
        query += ` AND extension_id = $${paramIndex++}`;
        params.push(extensionId);
      }

      if (productId) {
        query += ` AND product_id = $${paramIndex++}`;
        params.push(productId);
      }

      if (!includePrerelease) {
        query += ` AND is_stable = true`;
      }

      query += ` ORDER BY major DESC, minor DESC, patch DESC, released_at DESC`;

      const result = await pool.query(query, params);
      return result.rows.map(row => this.mapRowToVersion(row));
    } catch (error: any) {
      logger.error(`Error getting versions:`, error);
      throw new Error(`Failed to get versions: ${error.message}`);
    }
  },

  /**
   * Get latest version
   */
  async getLatestVersion(
    extensionId?: string,
    productId?: string,
    includePrerelease: boolean = false
  ): Promise<Version | null> {
    try {
      const versions = await this.getVersions(extensionId, productId, includePrerelease);
      return versions.length > 0 ? versions[0] : null;
    } catch (error: any) {
      logger.error(`Error getting latest version:`, error);
      throw new Error(`Failed to get latest version: ${error.message}`);
    }
  },

  /**
   * Compare two versions
   */
  compareVersions(version1: string, version2: string): VersionComparison {
    const v1 = this.parseSemanticVersion(version1);
    const v2 = this.parseSemanticVersion(version2);

    let result: 'greater' | 'equal' | 'less' = 'equal';
    
    if (v1.major > v2.major) {
      result = 'greater';
    } else if (v1.major < v2.major) {
      result = 'less';
    } else if (v1.minor > v2.minor) {
      result = 'greater';
    } else if (v1.minor < v2.minor) {
      result = 'less';
    } else if (v1.patch > v2.patch) {
      result = 'greater';
    } else if (v1.patch < v2.patch) {
      result = 'less';
    } else if (v1.prerelease && !v2.prerelease) {
      result = 'less';
    } else if (!v1.prerelease && v2.prerelease) {
      result = 'greater';
    }

    return {
      version1,
      version2,
      result,
      difference: {
        major: v1.major - v2.major,
        minor: v1.minor - v2.minor,
        patch: v1.patch - v2.patch,
      },
    };
  },

  /**
   * Increment version
   */
  incrementVersion(
    currentVersion: string,
    type: 'major' | 'minor' | 'patch'
  ): string {
    const parsed = this.parseSemanticVersion(currentVersion);
    
    switch (type) {
      case 'major':
        return `${parsed.major + 1}.0.0`;
      case 'minor':
        return `${parsed.major}.${parsed.minor + 1}.0`;
      case 'patch':
        return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    }
  },

  /**
   * Deprecate a version
   */
  async deprecateVersion(versionId: string, reason?: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE versions 
         SET is_deprecated = true, metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{deprecation_reason}', $1::jsonb)
         WHERE id = $2`,
        [JSON.stringify(reason || 'Deprecated'), versionId]
      );

      logger.info(`Version deprecated: ${versionId}`, { reason });
    } catch (error: any) {
      logger.error(`Error deprecating version:`, error);
      throw new Error(`Failed to deprecate version: ${error.message}`);
    }
  },

  /**
   * Parse semantic version
   */
  private parseSemanticVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  } {
    // Match semantic version pattern: major.minor.patch[-prerelease][+build]
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/);
    
    if (!match) {
      throw new Error(`Invalid semantic version: ${version}`);
    }

    return {
      major: parseInt(match[1]),
      minor: parseInt(match[2]),
      patch: parseInt(match[3]),
      prerelease: match[4],
      build: match[5],
    };
  },

  /**
   * Format changelog
   */
  private formatChangelog(entries: ChangelogEntry[]): string {
    const sections: Record<string, string[]> = {
      added: [],
      changed: [],
      deprecated: [],
      removed: [],
      fixed: [],
      security: [],
    };

    entries.forEach(entry => {
      const scope = entry.scope ? `**${entry.scope}:** ` : '';
      const breaking = entry.breaking ? '**BREAKING:** ' : '';
      sections[entry.type].push(`- ${breaking}${scope}${entry.description}`);
    });

    const lines: string[] = [];
    Object.entries(sections).forEach(([type, items]) => {
      if (items.length > 0) {
        lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
        lines.push(...items);
        lines.push('');
      }
    });

    return lines.join('\n');
  },

  /**
   * Map database row to Version
   */
  private mapRowToVersion(row: any): Version {
    return {
      id: row.id,
      version: row.version,
      major: row.major,
      minor: row.minor,
      patch: row.patch,
      prerelease: row.prerelease,
      build: row.build,
      extensionId: row.extension_id,
      productId: row.product_id,
      changelog: row.changelog,
      releaseNotes: row.release_notes,
      isStable: row.is_stable,
      isDeprecated: row.is_deprecated,
      releasedAt: new Date(row.released_at),
      releasedBy: row.released_by,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    };
  },
};

