/**
 * Revenue Sharing Service Tests
 */

import { revenueSharingService } from '../../services/revenueSharingService';

describe('RevenueSharingService', () => {
  describe('calculateRevenueShare', () => {
    it('should calculate correct revenue share with default 30% platform fee', () => {
      const result = revenueSharingService.calculateRevenueShare(10000); // $100.00
      
      expect(result.platformFee).toBe(30);
      expect(result.platformShare).toBe(3000); // $30.00
      expect(result.developerShare).toBe(7000); // $70.00
    });

    it('should calculate correct revenue share with custom platform fee', () => {
      const result = revenueSharingService.calculateRevenueShare(10000, 20); // 20% fee
      
      expect(result.platformFee).toBe(20);
      expect(result.platformShare).toBe(2000); // $20.00
      expect(result.developerShare).toBe(8000); // $80.00
    });

    it('should round platform fee correctly', () => {
      const result = revenueSharingService.calculateRevenueShare(10001, 30);
      
      // Should round to nearest cent
      expect(result.platformShare + result.developerShare).toBe(10001);
    });
  });
});

