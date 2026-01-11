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
    // Filter successful responses
    const successful = results.filter(r => r.success && r.response.length > 0);
    
    if (successful.length === 0) {
      throw new Error('No successful responses to aggregate');
    }

    // Filter by quality
    const qualityFiltered = this.filterByQuality(successful);

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
    const factors = {
      length: result.response.length > 100 ? 1.0 : result.response.length > 50 ? 0.7 : 0.4,
      latency: result.latency && result.latency < 5000 ? 1.0 : result.latency && result.latency < 10000 ? 0.7 : 0.5,
      modelReputation: this.getModelReputation(result.modelId),
      coherence: this.checkCoherence(result.response),
    };

    return (
      factors.length * 0.3 +
      factors.latency * 0.2 +
      factors.modelReputation * 0.3 +
      factors.coherence * 0.2
    );
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
    return responses
      .map(r => ({
        result: r,
        score: this.scoreQuality(r),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(({ result }) => result);
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(responses: ModelResult[], consensus: string): number {
    if (responses.length === 0) return 0;

    // Confidence based on:
    // 1. Number of successful responses
    // 2. Agreement between responses
    // 3. Quality of responses

    const successRate = responses.length / (responses.length + (responses.length === 0 ? 1 : 0));
    const avgQuality = responses.reduce((sum, r) => sum + this.scoreQuality(r), 0) / responses.length;
    
    // Simple agreement: check if top responses are similar
    const top3 = this.getTopResponses(responses, 3);
    const agreement = this.calculateAgreement(top3);

    return (successRate * 0.3 + avgQuality * 0.4 + agreement * 0.3);
  }

  /**
   * Calculate agreement between responses (0-1)
   */
  private calculateAgreement(responses: ModelResult[]): number {
    if (responses.length < 2) return 1.0;

    // Simple: check length similarity
    const lengths = responses.map(r => r.response.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgLength;

    // Lower variance = higher agreement
    return Math.max(0, 1 - coefficientOfVariation);
  }
}

export const aggregationService = new AggregationService();

