/**
 * Aggregation Service
 * 
 * Intelligently aggregates responses from multiple models:
 * - Weighted consensus
 * - Quality filtering
 * - Semantic grouping
 * - Best response selection
 */

import { ModelResult } from './parallelExecution';
import { modelManager } from './modelManager';

export interface AggregatedResponse {
  consensus: string;
  bestResponse: ModelResult;
  topResponses: ModelResult[];
  groups: ResponseGroup[];
  confidence: number;
}

export interface ResponseGroup {
  responses: ModelResult[];
  similarity: number;
  representative: ModelResult;
}

export class AggregationService {
  /**
   * Aggregate responses intelligently
   */
  aggregateResponses(results: ModelResult[]): AggregatedResponse {
    // Validate input
    this.validateResults(results);

    // Filter successful responses
    const successful = results.filter(r => r.success && r.response && r.response.length > 0);
    
    if (successful.length === 0) {
      throw new Error('No successful responses to aggregate');
    }

    // Filter by quality
    const qualityFiltered = this.filterByQuality(successful);

    // Ensure we have at least one quality response
    if (qualityFiltered.length === 0) {
      // If all filtered out, use original successful (lower threshold)
      const lowerThreshold = this.filterByQuality(successful, 0.3);
      if (lowerThreshold.length === 0) {
        throw new Error('No responses meet quality threshold');
      }
      const bestResponse = this.selectBest(lowerThreshold);
      const consensus = this.weightedConsensus(lowerThreshold);
      const groups = this.semanticGrouping(lowerThreshold);
      const topResponses = this.getTopResponses(lowerThreshold, 5);
      const confidence = this.calculateConfidence(lowerThreshold, consensus);

      return {
        consensus,
        bestResponse,
        topResponses,
        groups,
        confidence,
      };
    }

    // Select best response
    const bestResponse = this.selectBest(qualityFiltered);

    // Generate weighted consensus
    const consensus = this.weightedConsensus(qualityFiltered);

    // Group similar responses
    const groups = this.semanticGrouping(qualityFiltered);

    // Get top responses
    const topResponses = this.getTopResponses(qualityFiltered, 5);

    // Calculate confidence
    const confidence = this.calculateConfidence(qualityFiltered, consensus);

    return {
      consensus,
      bestResponse,
      topResponses,
      groups,
      confidence,
    };
  }

  /**
   * Filter responses by quality
   */
  private filterByQuality(responses: ModelResult[], threshold: number = 0.6): ModelResult[] {
    // Validate threshold
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
      throw new Error('Quality threshold must be a number between 0 and 1');
    }

    if (responses.length === 0) {
      return [];
    }

    return responses
      .map(r => ({
        result: r,
        quality: this.scoreQuality(r),
      }))
      .filter(({ quality }) => quality >= threshold)
      .sort((a, b) => b.quality - a.quality)
      .map(({ result }) => result);
  }

  /**
   * Score response quality (0-1)
   */
  private scoreQuality(result: ModelResult): number {
    // Validate result structure
    if (!result || !result.response || typeof result.response !== 'string') {
      return 0;
    }

    const factors = {
      length: result.response.length > 100 ? 1.0 : result.response.length > 50 ? 0.7 : 0.4,
      latency: result.latency && result.latency < 5000 ? 1.0 : result.latency && result.latency < 10000 ? 0.7 : 0.5,
      modelReputation: this.getModelReputation(result.modelId),
      coherence: this.checkCoherence(result.response),
    };

    const score = (
      factors.length * 0.3 +
      factors.latency * 0.2 +
      factors.modelReputation * 0.3 +
      factors.coherence * 0.2
    );

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get model reputation score (0-1)
   */
  private getModelReputation(modelId: string): number {
    const model = modelManager.getModel(modelId);
    if (!model) return 0.5;

    // Higher reputation for larger, specialized models
    if (model.category === 'coding' || model.category === 'reasoning') {
      return 0.9;
    }
    if (model.size > 5 * 1024 * 1024 * 1024) {
      return 0.8;
    }
    if (model.size > 3 * 1024 * 1024 * 1024) {
      return 0.7;
    }
    return 0.6;
  }

  /**
   * Check response coherence (simple heuristic)
   */
  private checkCoherence(response: string): number {
    // Simple heuristic: check for complete sentences, reasonable length
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0.3;
    if (sentences.length < 2) return 0.6;
    if (response.length < 20) return 0.4;
    return 1.0;
  }

  /**
   * Select best response
   */
  private selectBest(responses: ModelResult[]): ModelResult {
    if (responses.length === 0) {
      throw new Error('Cannot select best from empty responses array');
    }

    if (responses.length === 1) {
      return responses[0];
    }

    return responses.reduce((best, current) => {
      const bestScore = this.scoreQuality(best);
      const currentScore = this.scoreQuality(current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * Generate weighted consensus
   */
  private weightedConsensus(responses: ModelResult[]): string {
    if (responses.length === 0) {
      return '';
    }

    if (responses.length === 1) {
      return responses[0].response;
    }

    // Weight responses by quality
    const weighted = responses.map(r => ({
      response: r,
      weight: this.scoreQuality(r),
    }));

    // Sort by weight
    weighted.sort((a, b) => b.weight - a.weight);

    // Return highest weighted response (simple consensus)
    // TODO: Implement more sophisticated consensus (voting, semantic similarity)
    return weighted[0].response.response;
  }

  /**
   * Group similar responses semantically
   */
  private semanticGrouping(responses: ModelResult[]): ResponseGroup[] {
    // Simple grouping: group by response length similarity
    // TODO: Implement proper semantic similarity using embeddings
    
    const groups: ResponseGroup[] = [];
    const processed = new Set<number>();

    responses.forEach((response, index) => {
      if (processed.has(index)) return;

      const group: ResponseGroup = {
        responses: [response],
        similarity: 1.0,
        representative: response,
      };

      // Find similar responses (simple: similar length)
      responses.forEach((other, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex)) return;

        const lengthDiff = Math.abs(response.response.length - other.response.length);
        const avgLength = (response.response.length + other.response.length) / 2;
        const similarity = 1 - (lengthDiff / Math.max(avgLength, 1));

        if (similarity > 0.7) {
          group.responses.push(other);
          processed.add(otherIndex);
        }
      });

      groups.push(group);
      processed.add(index);
    });

    return groups;
  }

  /**
   * Get top N responses
   */
  private getTopResponses(responses: ModelResult[], n: number): ModelResult[] {
    if (responses.length === 0) {
      return [];
    }

    // Validate n
    if (typeof n !== 'number' || n < 0) {
      throw new Error('n must be a non-negative number');
    }

    const actualN = Math.min(n, responses.length);

    return responses
      .map(r => ({
        result: r,
        score: this.scoreQuality(r),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, actualN)
      .map(({ result }) => result);
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(responses: ModelResult[], consensus: string): number {
    if (responses.length === 0) return 0;

    // Confidence based on:
    // 1. Number of successful responses (always 1.0 since we filter)
    // 2. Agreement between responses
    // 3. Quality of responses

    const successRate = 1.0; // All responses are successful at this point
    const avgQuality = responses.reduce((sum, r) => sum + this.scoreQuality(r), 0) / responses.length;
    
    // Simple agreement: check if top responses are similar
    const top3 = this.getTopResponses(responses, Math.min(3, responses.length));
    const agreement = this.calculateAgreement(top3);

    const confidence = (successRate * 0.3 + avgQuality * 0.4 + agreement * 0.3);

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate agreement between responses (0-1)
   */
  private calculateAgreement(responses: ModelResult[]): number {
    if (responses.length < 2) return 1.0;

    // Simple: check length similarity
    const lengths = responses.map(r => r.response?.length || 0).filter(len => len > 0);
    
    if (lengths.length < 2) return 0.5; // Not enough data

    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    if (avgLength === 0) return 0; // All empty

    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgLength;

    // Lower variance = higher agreement
    const agreement = Math.max(0, 1 - coefficientOfVariation);
    return Math.min(1, agreement); // Ensure between 0 and 1
  }

  /**
   * Validate results array
   */
  private validateResults(results: ModelResult[]): void {
    if (!results) {
      throw new Error('Results array is required');
    }

    if (!Array.isArray(results)) {
      throw new Error('Results must be an array');
    }

    if (results.length === 0) {
      throw new Error('Results array cannot be empty');
    }

    // Validate each result has required fields
    results.forEach((result, index) => {
      if (!result || typeof result !== 'object') {
        throw new Error(`Result at index ${index} must be an object`);
      }

      if (typeof result.success !== 'boolean') {
        throw new Error(`Result at index ${index} must have a boolean 'success' field`);
      }

      if (!result.modelId || typeof result.modelId !== 'string') {
        throw new Error(`Result at index ${index} must have a string 'modelId' field`);
      }

      if (!result.modelName || typeof result.modelName !== 'string') {
        throw new Error(`Result at index ${index} must have a string 'modelName' field`);
      }

      if (result.response !== undefined && typeof result.response !== 'string') {
        throw new Error(`Result at index ${index} must have a string 'response' field or undefined`);
      }
    });
  }
}

export const aggregationService = new AggregationService();

