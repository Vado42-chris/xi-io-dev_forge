/**
 * Support Automation Service
 * 
 * Automated workflows and rules for support ticket management.
 */

import { logger } from '../utils/logger';
import { supportService, SupportTicket } from './supportService';
import { knowledgeBaseService } from './knowledgeBaseService';
import { aiChatbotService } from './aiChatbotService';

export interface AutomationRule {
  id: string;
  name: string;
  condition: (ticket: SupportTicket) => boolean;
  action: (ticket: SupportTicket) => Promise<void>;
  priority: number; // Higher priority runs first
  enabled: boolean;
}

export interface AutoResponse {
  id: string;
  trigger: string; // Keyword or pattern
  response: string;
  conditions?: Record<string, any>;
}

export const supportAutomationService = {
  private rules: AutomationRule[] = [],

  /**
   * Initialize automation rules
   */
  async initialize(): Promise<void> {
    this.rules = [
      {
        id: 'auto-assign-urgent',
        name: 'Auto-assign urgent tickets',
        condition: (ticket) => ticket.priority === 'urgent',
        action: async (ticket) => {
          // Auto-assign to available agent
          await supportService.updateTicket(ticket.id, {
            assignedTo: await this.findAvailableAgent(),
            status: 'in-progress',
          });
          logger.info(`Auto-assigned urgent ticket ${ticket.id}`);
        },
        priority: 10,
        enabled: true,
      },
      {
        id: 'auto-respond-common',
        name: 'Auto-respond to common questions',
        condition: (ticket) => {
          const commonKeywords = ['install', 'setup', 'how to', 'getting started'];
          return commonKeywords.some(keyword => 
            ticket.subject.toLowerCase().includes(keyword) ||
            ticket.description.toLowerCase().includes(keyword)
          );
        },
        action: async (ticket) => {
          // Find relevant knowledge base article
          const articles = await knowledgeBaseService.getAllArticles(
            'published',
            undefined,
            ticket.description,
            1,
            0
          );

          if (articles.length > 0) {
            const article = articles[0];
            await supportService.addMessageToTicket(
              ticket.id,
              'system',
              `Based on our knowledge base, here's a helpful article:\n\n${article.title}\n\n${article.content.substring(0, 500)}`
            );
          }
        },
        priority: 5,
        enabled: true,
      },
      {
        id: 'escalate-stale',
        name: 'Escalate stale tickets',
        condition: (ticket) => {
          const daysSinceUpdate = (Date.now() - new Date(ticket.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          return ticket.status === 'open' && daysSinceUpdate > 3;
        },
        action: async (ticket) => {
          await supportService.updateTicket(ticket.id, {
            priority: ticket.priority === 'low' ? 'medium' : 'high',
          });
          logger.info(`Escalated stale ticket ${ticket.id}`);
        },
        priority: 3,
        enabled: true,
      },
      {
        id: 'auto-close-resolved',
        name: 'Auto-close resolved tickets',
        condition: (ticket) => {
          const daysSinceResolved = (Date.now() - new Date(ticket.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          return ticket.status === 'resolved' && daysSinceResolved > 7;
        },
        action: async (ticket) => {
          await supportService.updateTicket(ticket.id, {
            status: 'closed',
          });
          logger.info(`Auto-closed resolved ticket ${ticket.id}`);
        },
        priority: 1,
        enabled: true,
      },
    ];

    logger.info(`Initialized ${this.rules.length} automation rules`);
  },

  /**
   * Process ticket through automation rules
   */
  async processTicket(ticket: SupportTicket): Promise<void> {
    // Sort rules by priority (highest first)
    const sortedRules = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        if (rule.condition(ticket)) {
          await rule.action(ticket);
          logger.info(`Applied automation rule ${rule.name} to ticket ${ticket.id}`);
        }
      } catch (error: any) {
        logger.error(`Error applying rule ${rule.name} to ticket ${ticket.id}:`, error);
      }
    }
  },

  /**
   * Find available agent
   */
  async findAvailableAgent(): Promise<string | null> {
    // TODO: Implement agent availability logic
    // For now, return null (no auto-assignment)
    return null;
  },

  /**
   * Generate auto-response
   */
  async generateAutoResponse(ticket: SupportTicket): Promise<string | null> {
    // Try to find matching knowledge base article
    const articles = await knowledgeBaseService.getAllArticles(
      'published',
      undefined,
      `${ticket.subject} ${ticket.description}`,
      1,
      0
    );

    if (articles.length > 0) {
      const article = articles[0];
      return `Based on our knowledge base, this article might help:\n\n**${article.title}**\n\n${article.content.substring(0, 300)}...\n\n[Read full article]`;
    }

    // Try chatbot
    const chatbotResponse = await aiChatbotService.processMessage(
      `ticket-${ticket.id}`,
      ticket.description,
      ticket.userId
    );

    if (chatbotResponse.confidence > 0.7) {
      return chatbotResponse.message;
    }

    return null;
  },

  /**
   * Add automation rule
   */
  addRule(rule: AutomationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  },

  /**
   * Remove automation rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  },

  /**
   * Get all rules
   */
  getRules(): AutomationRule[] {
    return [...this.rules];
  },
};

