/**
 * Tax Reporting Service Tests
 */

import { taxReportingService } from '../../services/taxReportingService';

describe('TaxReportingService', () => {
  describe('calculateTaxRate', () => {
    it('should return default tax rate for US developers', () => {
      const rate = taxReportingService.calculateTaxRate('developer-id', 100000);
      expect(rate).toBe(15); // Default 15%
    });

    it('should handle different earnings amounts', () => {
      const rate1 = taxReportingService.calculateTaxRate('developer-id', 50000);
      const rate2 = taxReportingService.calculateTaxRate('developer-id', 200000);
      
      // For now, both should return default rate
      expect(rate1).toBe(15);
      expect(rate2).toBe(15);
    });
  });
});

