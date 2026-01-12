/**
 * Permission Validator
 * 
 * Validates plugin permissions before allowing actions.
 */

import { PluginPermissions } from './types';
import minimatch from 'minimatch';

export class PermissionValidator {
  /**
   * Validate permission for an action
   */
  validate(permissions: PluginPermissions, action: string, resource: string): boolean {
    switch (action) {
      case 'readFile':
        return this.validateFileAccess(permissions.fileSystem, resource);
      case 'writeFile':
        return this.validateFileAccess(permissions.fileSystem, resource);
      case 'executeFile':
        return this.validateFileAccess(permissions.fileSystem, resource);
      case 'network':
        return permissions.network === true;
      case 'model':
        return permissions.model?.includes(resource) || permissions.model?.includes('*') || false;
      case 'api':
        return permissions.api?.includes(resource) || permissions.api?.includes('*') || false;
      case 'command':
        return permissions.command?.includes(resource) || permissions.command?.includes('*') || false;
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
   * Validate domain access (if network permission is granted)
   */
  validateDomain(permissions: PluginPermissions, domain: string): boolean {
    if (!permissions.network) {
      return false;
    }
    // If network is true, all domains are allowed
    return true;
  }
}

