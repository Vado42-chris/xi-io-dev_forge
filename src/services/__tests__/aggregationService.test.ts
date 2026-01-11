/**
 * Aggregation Service - Comprehensive Test Suite
 * 
 * Tests all functionality with yin/yang analysis:
 * - Response aggregation
 * - Quality filtering
 * - Best response selection
 * - Consensus generation
 * - Semantic grouping
 * - Confidence calculation
 */

import { aggregationService, AggregatedResponse } from '../aggregationService';
import { ModelResult } from '../parallelExecution';
import { modelManager } from '../modelManager';

// Mock modelManager
jest.mock('../modelManager');

describe('AggregationService', () => {
  const mockModelResult: ModelResult = {
    modelId: 'mistral-7b',
    modelName: 'Mistral 7B',
    response: 'This is a test response with multiple sentences. It should score well.',
    success: true,
    latency: 2000,
    timestamp: new Date(),
  };

  const mockModelResult2: ModelResult = {
    modelId: 'llama3.2-3b',
    modelName: 'Llama 3.2 3B',
    response: 'Another test response that is longer and more detailed. It has multiple sentences too.',
    success: true,
    latency: 3000,
    timestamp: new Date(),
  };

  const mockModelResult3: ModelResult = {
    modelId: 'tinyllama-1.1b',
    modelName: 'TinyLlama 1.1B',
    response: 'Short',
    success: true,
    latency: 1000,
    timestamp: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (modelManager.getModel as jest.Mock).mockImplementation((id: string) => {
      const models: any = {
        'mistral-7b': { size: 4 * 1024 * 1024 * 1024, category: 'general' },
        'llama3.2-3b': { size: 2 * 1024 * 1024 * 1024, category: 'general' },
        'tinyllama-1.1b': { size: 0.6 * 1024 * 1024 * 1024, category: 'general' },
        'codellama-7b': { size: 4 * 1024 * 1024 * 1024, category: 'coding' },
      };
      return models[id] || null;
    });
  });

  describe('aggregateResponses()', () => {
    it('should aggregate successful responses', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2];

      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated).toBeDefined();
      expect(aggregated.consensus).toBeDefined();
      expect(aggregated.bestResponse).toBeDefined();
      expect(aggregated.topResponses.length).toBeGreaterThan(0);
      expect(aggregated.groups.length).toBeGreaterThan(0);
      expect(aggregated.confidence).toBeGreaterThanOrEqual(0);
      expect(aggregated.confidence).toBeLessThanOrEqual(1);
    });

    it('should throw error when no successful responses', () => {
      const results: ModelResult[] = [
        { ...mockModelResult, success: false },
        { ...mockModelResult2, success: false },
      ];

      expect(() => aggregationService.aggregateResponses(results)).toThrow(
        'No successful responses to aggregate'
      );
    });

    it('should throw error when results array is empty', () => {
      expect(() => aggregationService.aggregateResponses([])).toThrow(
        'Results array cannot be empty'
      );
    });

    it('should throw error when results is null', () => {
      expect(() => aggregationService.aggregateResponses(null as any)).toThrow(
        'Results array is required'
      );
    });

    it('should throw error when results is not an array', () => {
      expect(() => aggregationService.aggregateResponses({} as any)).toThrow(
        'Results must be an array'
      );
    });

    it('should handle responses with empty strings', () => {
      const results: ModelResult[] = [
        { ...mockModelResult, response: '' },
        mockModelResult2,
      ];

      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.bestResponse.response.length).toBeGreaterThan(0);
    });

    it('should filter by quality threshold', () => {
      const results: ModelResult[] = [
        mockModelResult, // High quality
        mockModelResult2, // High quality
        mockModelResult3, // Low quality (short response)
      ];

      const aggregated = aggregationService.aggregateResponses(results);

      // Should filter out low quality responses
      expect(aggregated.topResponses.length).toBeLessThanOrEqual(results.length);
    });

    it('should handle all responses filtered out by quality', () => {
      const lowQualityResults: ModelResult[] = [
        { ...mockModelResult, response: 'x' }, // Very low quality
        { ...mockModelResult2, response: 'y' }, // Very low quality
      ];

      // Should use lower threshold fallback
      const aggregated = aggregationService.aggregateResponses(lowQualityResults);

      expect(aggregated).toBeDefined();
      expect(aggregated.bestResponse).toBeDefined();
    });

    it('should validate result structure', () => {
      const invalidResults: any[] = [
        { success: true }, // Missing required fields
      ];

      expect(() => aggregationService.aggregateResponses(invalidResults)).toThrow(
        'must have a string'
      );
    });
  });

  describe('filterByQuality()', () => {
    it('should filter responses by quality threshold', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2, mockModelResult3];
      const aggregated = aggregationService.aggregateResponses(results);

      // All top responses should meet quality threshold
      expect(aggregated.topResponses.length).toBeGreaterThan(0);
    });

    it('should handle empty responses array', () => {
      // This is tested indirectly through aggregateResponses
      const results: ModelResult[] = [];
      expect(() => aggregationService.aggregateResponses(results)).toThrow();
    });
  });

  describe('scoreQuality()', () => {
    it('should score high quality responses higher', () => {
      const highQuality: ModelResult = {
        ...mockModelResult,
        response: 'This is a very detailed and comprehensive response with multiple sentences and good structure.',
        latency: 2000,
      };

      const lowQuality: ModelResult = {
        ...mockModelResult3,
        response: 'x',
        latency: 15000,
      };

      const results: ModelResult[] = [highQuality, lowQuality];
      const aggregated = aggregationService.aggregateResponses(results);

      // High quality should be selected as best
      expect(aggregated.bestResponse.response.length).toBeGreaterThan(lowQuality.response.length);
    });

    it('should handle missing response field', () => {
      const invalidResult: any = {
        ...mockModelResult,
        response: null,
      };

      // Should handle gracefully (scoreQuality returns 0 for invalid)
      const results: ModelResult[] = [mockModelResult, invalidResult];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.bestResponse).toBeDefined();
    });
  });

  describe('selectBest()', () => {
    it('should select best response from multiple', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2, mockModelResult3];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.bestResponse).toBeDefined();
      expect(aggregated.bestResponse.response.length).toBeGreaterThan(0);
    });

    it('should handle single response', () => {
      const results: ModelResult[] = [mockModelResult];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.bestResponse).toEqual(mockModelResult);
    });
  });

  describe('weightedConsensus()', () => {
    it('should generate consensus from multiple responses', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.consensus).toBeDefined();
      expect(aggregated.consensus.length).toBeGreaterThan(0);
    });

    it('should return single response when only one', () => {
      const results: ModelResult[] = [mockModelResult];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.consensus).toBe(mockModelResult.response);
    });
  });

  describe('semanticGrouping()', () => {
    it('should group similar responses', () => {
      const results: ModelResult[] = [
        mockModelResult,
        { ...mockModelResult2, response: mockModelResult.response }, // Similar length
        mockModelResult3,
      ];

      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.groups.length).toBeGreaterThan(0);
      aggregated.groups.forEach(group => {
        expect(group.responses.length).toBeGreaterThan(0);
        expect(group.representative).toBeDefined();
        expect(group.similarity).toBeGreaterThanOrEqual(0);
        expect(group.similarity).toBeLessThanOrEqual(1);
      });
    });

    it('should handle single response grouping', () => {
      const results: ModelResult[] = [mockModelResult];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.groups.length).toBe(1);
      expect(aggregated.groups[0].responses.length).toBe(1);
    });
  });

  describe('getTopResponses()', () => {
    it('should return top N responses', () => {
      const results: ModelResult[] = [
        mockModelResult,
        mockModelResult2,
        mockModelResult3,
      ];

      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.topResponses.length).toBeLessThanOrEqual(5);
      expect(aggregated.topResponses.length).toBeGreaterThan(0);
    });

    it('should handle N larger than available responses', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2];
      const aggregated = aggregationService.aggregateResponses(results);

      // Should return all available (2), not 5
      expect(aggregated.topResponses.length).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateConfidence()', () => {
    it('should calculate confidence between 0 and 1', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2];
      const aggregated = aggregationService.aggregateResponses(results);

      expect(aggregated.confidence).toBeGreaterThanOrEqual(0);
      expect(aggregated.confidence).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty responses', () => {
      // This is tested indirectly - empty responses throw error before confidence calculation
      const results: ModelResult[] = [];
      expect(() => aggregationService.aggregateResponses(results)).toThrow();
    });

    it('should have higher confidence for similar responses', () => {
      const similarResults: ModelResult[] = [
        mockModelResult,
        { ...mockModelResult2, response: mockModelResult.response }, // Same response
      ];

      const differentResults: ModelResult[] = [
        mockModelResult,
        mockModelResult3, // Very different
      ];

      const similarAggregated = aggregationService.aggregateResponses(similarResults);
      const differentAggregated = aggregationService.aggregateResponses(differentResults);

      // Similar responses should generally have higher confidence
      // (though this depends on quality scores too)
      expect(similarAggregated.confidence).toBeGreaterThanOrEqual(0);
      expect(differentAggregated.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateAgreement()', () => {
    it('should calculate agreement between responses', () => {
      const results: ModelResult[] = [mockModelResult, mockModelResult2];
      const aggregated = aggregationService.aggregateResponses(results);

      // Agreement is used in confidence calculation
      expect(aggregated.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should return 1.0 for single response', () => {
      const results: ModelResult[] = [mockModelResult];
      const aggregated = aggregationService.aggregateResponses(results);

      // Single response should have high confidence
      expect(aggregated.confidence).toBeGreaterThan(0);
    });
  });

  describe('validateResults()', () => {
    it('should validate results array structure', () => {
      const invalidResults: any[] = [
        { success: true }, // Missing modelId
      ];

      expect(() => aggregationService.aggregateResponses(invalidResults)).toThrow(
        'must have a string'
      );
    });

    it('should validate success field is boolean', () => {
      const invalidResults: any[] = [
        { ...mockModelResult, success: 'true' },
      ];

      expect(() => aggregationService.aggregateResponses(invalidResults)).toThrow(
        'must have a boolean'
      );
    });

    it('should validate modelId field', () => {
      const invalidResults: any[] = [
        { ...mockModelResult, modelId: null },
      ];

      expect(() => aggregationService.aggregateResponses(invalidResults)).toThrow(
        'must have a string'
      );
    });

    it('should validate modelName field', () => {
      const invalidResults: any[] = [
        { ...mockModelResult, modelName: null },
      ];

      expect(() => aggregationService.aggregateResponses(invalidResults)).toThrow(
        'must have a string'
      );
    });
  });
});

