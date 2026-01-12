/**
 * Version Management Service Tests
 */

import { versionManagementService } from '../../services/versionManagementService';

describe('VersionManagementService', () => {
  describe('parseSemanticVersion', () => {
    it('should parse valid semantic version', () => {
      const parsed = (versionManagementService as any).parseSemanticVersion('1.2.3');
      
      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(2);
      expect(parsed.patch).toBe(3);
    });

    it('should parse version with prerelease', () => {
      const parsed = (versionManagementService as any).parseSemanticVersion('1.2.3-beta.1');
      
      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(2);
      expect(parsed.patch).toBe(3);
      expect(parsed.prerelease).toBe('beta.1');
    });

    it('should throw error for invalid version', () => {
      expect(() => {
        (versionManagementService as any).parseSemanticVersion('invalid');
      }).toThrow('Invalid semantic version');
    });
  });

  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      const comparison = versionManagementService.compareVersions('1.2.3', '1.2.4');
      expect(comparison.result).toBe('less');

      const comparison2 = versionManagementService.compareVersions('1.2.4', '1.2.3');
      expect(comparison2.result).toBe('greater');

      const comparison3 = versionManagementService.compareVersions('1.2.3', '1.2.3');
      expect(comparison3.result).toBe('equal');
    });
  });

  describe('incrementVersion', () => {
    it('should increment major version', () => {
      const newVersion = versionManagementService.incrementVersion('1.2.3', 'major');
      expect(newVersion).toBe('2.0.0');
    });

    it('should increment minor version', () => {
      const newVersion = versionManagementService.incrementVersion('1.2.3', 'minor');
      expect(newVersion).toBe('1.3.0');
    });

    it('should increment patch version', () => {
      const newVersion = versionManagementService.incrementVersion('1.2.3', 'patch');
      expect(newVersion).toBe('1.2.4');
    });
  });
});

