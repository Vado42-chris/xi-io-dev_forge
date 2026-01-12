/**
 * Knowledge Base Automation Service
 * 
 * Automated knowledge base article generation and management.
 */

import { logger } from '../utils/logger';
import { knowledgeBaseService, KnowledgeBaseArticle } from './knowledgeBaseService';
import { supportService, SupportTicket } from './supportService';

export interface ArticleSuggestion {
  ticketId: string;
  suggestedTitle: string;
  suggestedContent: string;
  confidence: number;
  basedOnTicket: boolean;
}

export const knowledgeBaseAutomationService = {
  /**
   * Generate article suggestions from resolved tickets
   */
  async generateArticleSuggestions(ticket: SupportTicket): Promise<ArticleSuggestion[]> {
    const suggestions: ArticleSuggestion[] = [];

    // Only suggest for resolved tickets with good content
    if (ticket.status !== 'resolved' || ticket.description.length < 100) {
      return suggestions;
    }

    // Check if similar article already exists
    const existingArticles = await knowledgeBaseService.getAllArticles(
      'published',
      undefined,
      ticket.description,
      5,
      0
    );

    if (existingArticles.length > 0) {
      // Article already exists, suggest updating it
      suggestions.push({
        ticketId: ticket.id,
        suggestedTitle: existingArticles[0].title,
        suggestedContent: `Updated based on ticket ${ticket.id}:\n\n${ticket.description}`,
        confidence: 0.8,
        basedOnTicket: true,
      });
    } else {
      // Suggest new article
      const title = this.generateTitleFromTicket(ticket);
      const content = this.generateContentFromTicket(ticket);

      suggestions.push({
        ticketId: ticket.id,
        suggestedTitle: title,
        suggestedContent: content,
        confidence: this.calculateConfidence(ticket),
        basedOnTicket: true,
      });
    }

    return suggestions;
  },

  /**
   * Generate title from ticket
   */
  generateTitleFromTicket(ticket: SupportTicket): string {
    // Extract key phrases from ticket
    const words = ticket.description.toLowerCase().split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 4 && 
      !['the', 'this', 'that', 'with', 'from', 'about'].includes(word)
    );

    // Use first few important words
    const titleWords = importantWords.slice(0, 5).join(' ');
    return titleWords.charAt(0).toUpperCase() + titleWords.slice(1);
  },

  /**
   * Generate content from ticket
   */
  generateContentFromTicket(ticket: SupportTicket): string {
    // Structure content from ticket
    let content = `## Problem\n\n${ticket.description}\n\n`;

    // Try to extract solution from ticket messages
    // TODO: Extract from ticket messages if available

    content += `## Solution\n\n[Solution details from ticket ${ticket.id}]\n\n`;
    content += `## Related Information\n\nFor more help, contact support.`;

    return content;
  },

  /**
   * Calculate confidence for article suggestion
   */
  calculateConfidence(ticket: SupportTicket): number {
    let confidence = 0.5;

    // Increase confidence based on ticket characteristics
    if (ticket.description.length > 200) {
      confidence += 0.2;
    }

    if (ticket.priority === 'high' || ticket.priority === 'urgent') {
      confidence += 0.1;
    }

    // Check if ticket was resolved quickly (good documentation candidate)
    // TODO: Calculate resolution time

    return Math.min(1, confidence);
  },

  /**
   * Auto-create article from ticket
   */
  async autoCreateArticle(
    ticket: SupportTicket,
    authorId: string,
    title?: string,
    content?: string
  ): Promise<KnowledgeBaseArticle> {
    const finalTitle = title || this.generateTitleFromTicket(ticket);
    const finalContent = content || this.generateContentFromTicket(ticket);

    // Determine category from ticket category
    const category = this.mapTicketCategoryToKbCategory(ticket.category);

    // Extract tags from ticket
    const tags = this.extractTagsFromTicket(ticket);

    const article = await knowledgeBaseService.createArticle(
      finalTitle,
      finalContent,
      category,
      tags,
      authorId,
      'draft' // Start as draft for review
    );

    logger.info(`Auto-created knowledge base article from ticket ${ticket.id}: ${article.id}`);

    return article;
  },

  /**
   * Map ticket category to KB category
   */
  mapTicketCategoryToKbCategory(ticketCategory: string): string {
    const mapping: Record<string, string> = {
      'technical': 'Technical Support',
      'billing': 'Billing & Payments',
      'feature-request': 'Features',
      'bug-report': 'Troubleshooting',
      'other': 'General',
    };

    return mapping[ticketCategory] || 'General';
  },

  /**
   * Extract tags from ticket
   */
  extractTagsFromTicket(ticket: SupportTicket): string[] {
    const tags: string[] = [];

    // Extract keywords from description
    const words = ticket.description.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'about', 'support', 'help'].includes(word)
    );

    // Take top keywords as tags
    tags.push(...keywords.slice(0, 5));

    // Add category as tag
    if (ticket.category) {
      tags.push(ticket.category);
    }

    return tags;
  },

  /**
   * Update article based on new ticket
   */
  async updateArticleFromTicket(
    articleId: string,
    ticket: SupportTicket
  ): Promise<KnowledgeBaseArticle> {
    const article = await knowledgeBaseService.getArticle(articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Append ticket information to article
    const updatedContent = `${article.content}\n\n---\n\n## Update from Ticket ${ticket.id}\n\n${ticket.description}`;

    const updated = await knowledgeBaseService.updateArticle(articleId, {
      content: updatedContent,
      tags: [...article.tags, ...this.extractTagsFromTicket(ticket)],
    });

    logger.info(`Updated knowledge base article ${articleId} from ticket ${ticket.id}`);

    return updated;
  },

  /**
   * Find articles that need updating
   */
  async findArticlesNeedingUpdate(): Promise<KnowledgeBaseArticle[]> {
    // Find articles with low views or old content
    const allArticles = await knowledgeBaseService.getAllArticles('published', undefined, undefined, 100, 0);
    
    const now = Date.now();
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60 * 1000);

    return allArticles.filter(article => {
      const articleDate = new Date(article.updatedAt).getTime();
      return article.views < 10 || articleDate < sixMonthsAgo;
    });
  },
};

