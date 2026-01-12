/**
 * Permission Validator
 * 
 * Validates plugin permissions before allowing actions.
 */

import { PluginPermissions } from './types';
import { minimatch } from 'minimatch';

export class PermissionValidator {
  /**
   * Validate permission for an action
   */
  validate(permissions: PluginPermissions, action: string, resource: string): boolean {
    switch (action) {
      case 'readFile':
        return this.validateFileAccess(permissions.readFiles, resource);
      case 'writeFile':
        return this.validateFileAccess(permissions.writeFiles, resource);
      case 'executeFile':
        return this.validateFileAccess(permissions.executeFiles, resource);
      case 'network':
        return permissions.networkAccess === true;
      case 'model':
        return permissions.modelAccess?.includes(resource) || false;
      case 'api':
        return permissions.apiAccess?.includes(resource) || false;
      case 'command':
        return permissions.commandExecution === true;
      case 'systemCommand':
        return permissions.systemCommands === true;
      default:
        return false;
    }
  }

  /**
   * Validate file access
   */
  private validateFileAccess(allowed: string[] | undefined, path: string): boolean {
    if (!allowed) return false;
    return allowed.some(pattern => this.matchPattern(pattern, path));
  }

  /**
   * Match glob pattern
   */
  private matchPattern(pattern: string, path: string): boolean {
    try {
      return minimatch(path, pattern);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate domain access
   */
  validateDomain(permissions: PluginPermissions, domain: string): boolean {
    if (!permissions.networkAccess) {
      return false;
    }

    if (!permissions.allowedDomains || permissions.allowedDomains.length === 0) {
      return true; // All domains allowed if networkAccess is true
    }

    return permissions.allowedDomains.some(allowed => {
      // Exact match
      if (allowed === domain) return true;
      // Wildcard match
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.slice(2);
        return domain.endsWith('.' + baseDomain) || domain === baseDomain;
      }
      return false;
    });
  }

  /**
   * Validate environment variable access
   */
  validateEnvVar(permissions: PluginPermissions, envVar: string): boolean {
    if (!permissions.environmentVariables) {
      return false;
    }

    return permissions.environmentVariables.includes(envVar);
  }
}

