/**
 * AI Chatbot Service
 * 
 * Automated AI-powered support chatbot for customer service.
 */

import { logger } from '../utils/logger';
import { knowledgeBaseService } from './knowledgeBaseService';
import { supportService } from './supportService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  context?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatResponse {
  message: string;
  confidence: number; // 0-1
  suggestedActions?: string[];
  knowledgeBaseArticles?: string[]; // Article IDs
  escalateToHuman?: boolean;
}

export const aiChatbotService = {
  /**
   * Process user message and generate response
   */
  async processMessage(
    sessionId: string,
    message: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<ChatResponse> {
    try {
      logger.info(`Processing chatbot message: ${sessionId}`);

      // Search knowledge base for relevant articles
      const kbResults = await knowledgeBaseService.getAllArticles(
        'published',
        undefined,
        message,
        5,
        0
      );

      // Determine if we should escalate to human
      const shouldEscalate = this.shouldEscalateToHuman(message, kbResults.length === 0);

      if (shouldEscalate) {
        // Create support ticket automatically
        if (userId) {
          await supportService.createTicket(
            userId,
            'Chatbot Escalation',
            `User message: ${message}\n\nEscalated from chatbot session: ${sessionId}`,
            'medium'
          );
        }

        return {
          message: "I'm having trouble finding the right answer. Let me connect you with a human support agent who can help you better.",
          confidence: 0.3,
          escalateToHuman: true,
        };
      }

      // Generate response based on knowledge base
      const response = await this.generateResponse(message, kbResults);

      return response;
    } catch (error: any) {
      logger.error('Error processing chatbot message:', error);
      return {
        message: "I'm sorry, I encountered an error. Please try again or contact support.",
        confidence: 0,
        escalateToHuman: true,
      };
    }
  },

  /**
   * Generate response from knowledge base
   */
  async generateResponse(message: string, articles: any[]): Promise<ChatResponse> {
    if (articles.length === 0) {
      return {
        message: "I couldn't find specific information about that. Could you provide more details?",
        confidence: 0.2,
        suggestedActions: ['Search knowledge base', 'Contact support'],
      };
    }

    // Use the most relevant article
    const topArticle = articles[0];
    const confidence = this.calculateConfidence(message, topArticle);

    // Generate response based on article
    let responseMessage = `Based on our knowledge base:\n\n${topArticle.content.substring(0, 500)}`;
    
    if (topArticle.content.length > 500) {
      responseMessage += `\n\nFor more details, see: ${topArticle.title}`;
    }

    return {
      message: responseMessage,
      confidence,
      knowledgeBaseArticles: [topArticle.id],
      suggestedActions: articles.length > 1 
        ? [`Read ${articles.length - 1} more related articles`]
        : undefined,
    };
  },

  /**
   * Calculate confidence score
   */
  calculateConfidence(message: string, article: any): number {
    // Simple keyword matching for now
    // TODO: Use more sophisticated NLP
    const messageLower = message.toLowerCase();
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    let matches = 0;
    const words = messageLower.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 3 && (titleLower.includes(word) || contentLower.includes(word))) {
        matches++;
      }
    }

    return Math.min(1, matches / words.length);
  },

  /**
   * Determine if should escalate to human
   */
  shouldEscalateToHuman(message: string, noKbResults: boolean): boolean {
    // Escalate if:
    // - No knowledge base results
    // - Contains escalation keywords
    // - Message is very long (complex issue)
    // - Contains negative sentiment

    const escalationKeywords = [
      'speak to someone',
      'talk to human',
      'contact support',
      'not working',
      'broken',
      'error',
      'bug',
      'refund',
      'cancel',
    ];

    const messageLower = message.toLowerCase();
    
    if (noKbResults && message.length > 200) {
      return true;
    }

    if (escalationKeywords.some(keyword => messageLower.includes(keyword))) {
      return true;
    }

    return false;
  },

  /**
   * Get suggested responses
   */
  getSuggestedResponses(context: Record<string, any>): string[] {
    // Return common questions based on context
    const commonQuestions = [
      "How do I install an extension?",
      "How do I report a bug?",
      "How do I get a refund?",
      "How do I update my license?",
      "How do I contact support?",
    ];

    return commonQuestions;
  },

  /**
   * Analyze sentiment
   */
  analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis
    // TODO: Use more sophisticated NLP
    const negativeWords = ['bad', 'terrible', 'awful', 'broken', 'error', 'bug', 'problem'];
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'helpful', 'works'];

    const messageLower = message.toLowerCase();
    
    const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;
    const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;

    if (negativeCount > positiveCount) {
      return 'negative';
    } else if (positiveCount > negativeCount) {
      return 'positive';
    }
    
    return 'neutral';
  },
};

