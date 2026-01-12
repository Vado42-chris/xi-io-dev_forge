/**
 * Persona System
 * 
 * Manages AI personas and "between the lines" schema filtering.
 * Part of the VectorForge Framework - prevents AI "ghosting".
 */

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  schema: PersonaSchema;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaSchema {
  // "Between the lines" filtering rules
  includeContext: string[];
  excludeContext: string[];
  requiredKeywords: string[];
  forbiddenKeywords: string[];
  contextWindow: number; // How much context to include
  filterMode: 'strict' | 'lenient' | 'custom';
}

export interface PersonaConfig {
  personaId: string;
  modelId: string;
  customInstructions?: string;
  temperature?: number;
  topP?: number;
}

export class PersonaSystem {
  private personas: Map<string, Persona> = new Map();
  private activePersonas: Map<string, PersonaConfig> = new Map();
  private statusCallbacks: Set<(personas: Persona[]) => void> = new Set();

  constructor() {
    this.initializeDefaultPersonas();
  }

  /**
   * Initialize default personas
   */
  private initializeDefaultPersonas(): void {
    const defaultPersonas: Persona[] = [
      {
        id: 'persona-code-reviewer',
        name: 'Code Reviewer',
        description: 'Focused on code quality, best practices, and security',
        systemPrompt: 'You are an expert code reviewer. Focus on code quality, best practices, security vulnerabilities, and performance issues.',
        schema: {
          includeContext: ['code', 'function', 'class', 'method'],
          excludeContext: ['comments', 'documentation'],
          requiredKeywords: ['review', 'quality', 'security'],
          forbiddenKeywords: [],
          contextWindow: 2000,
          filterMode: 'strict',
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'persona-documentation',
        name: 'Documentation Writer',
        description: 'Creates clear, comprehensive documentation',
        systemPrompt: 'You are a technical documentation expert. Write clear, comprehensive, and well-structured documentation.',
        schema: {
          includeContext: ['code', 'comments', 'function', 'api'],
          excludeContext: ['test', 'debug'],
          requiredKeywords: ['documentation', 'explain', 'describe'],
          forbiddenKeywords: ['todo', 'fixme'],
          contextWindow: 3000,
          filterMode: 'lenient',
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'persona-debugger',
        name: 'Debug Specialist',
        description: 'Expert at finding and fixing bugs',
        systemPrompt: 'You are a debugging expert. Analyze code to find bugs, identify root causes, and suggest fixes.',
        schema: {
          includeContext: ['error', 'bug', 'issue', 'code', 'stack'],
          excludeContext: ['documentation', 'comments'],
          requiredKeywords: ['error', 'bug', 'issue'],
          forbiddenKeywords: [],
          contextWindow: 1500,
          filterMode: 'strict',
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultPersonas.forEach(persona => {
      this.personas.set(persona.id, persona);
    });
  }

  /**
   * Create a new persona
   */
  createPersona(persona: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Persona {
    const newPersona: Persona = {
      ...persona,
      id: `persona-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.personas.set(newPersona.id, newPersona);
    this.notifyStatusChange();
    return newPersona;
  }

  /**
   * Get all personas
   */
  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }

  /**
   * Get enabled personas
   */
  getEnabledPersonas(): Persona[] {
    return this.getAllPersonas().filter(p => p.enabled);
  }

  /**
   * Get persona by ID
   */
  getPersona(id: string): Persona | undefined {
    return this.personas.get(id);
  }

  /**
   * Activate persona for a model
   */
  activatePersona(config: PersonaConfig): void {
    this.activePersonas.set(`${config.modelId}-${config.personaId}`, config);
    this.notifyStatusChange();
  }

  /**
   * Deactivate persona
   */
  deactivatePersona(modelId: string, personaId: string): void {
    this.activePersonas.delete(`${modelId}-${personaId}`);
    this.notifyStatusChange();
  }

  /**
   * Get active persona for model
   */
  getActivePersona(modelId: string): PersonaConfig | undefined {
    for (const [key, config] of this.activePersonas.entries()) {
      if (config.modelId === modelId) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Apply "between the lines" schema filtering
   */
  filterContext(context: string, schema: PersonaSchema): string {
    let filtered = context;

    // Apply include/exclude context rules
    if (schema.excludeContext.length > 0) {
      const excludePattern = new RegExp(
        schema.excludeContext.join('|'),
        'gi'
      );
      filtered = filtered.replace(excludePattern, '');
    }

    // Check for required keywords
    if (schema.requiredKeywords.length > 0) {
      const hasRequired = schema.requiredKeywords.some(keyword =>
        filtered.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasRequired && schema.filterMode === 'strict') {
        return ''; // Reject if required keywords missing
      }
    }

    // Check for forbidden keywords
    if (schema.forbiddenKeywords.length > 0) {
      const hasForbidden = schema.forbiddenKeywords.some(keyword =>
        filtered.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasForbidden && schema.filterMode === 'strict') {
        return ''; // Reject if forbidden keywords present
      }
    }

    // Apply context window limit
    if (filtered.length > schema.contextWindow) {
      filtered = filtered.slice(-schema.contextWindow);
    }

    return filtered;
  }

  /**
   * Build prompt with persona
   */
  buildPrompt(userPrompt: string, personaId: string, context?: string): string {
    const persona = this.personas.get(personaId);
    if (!persona) {
      return userPrompt;
    }

    let fullPrompt = persona.systemPrompt + '\n\n';

    // Apply schema filtering to context if provided
    if (context) {
      const filteredContext = this.filterContext(context, persona.schema);
      if (filteredContext) {
        fullPrompt += `Context:\n${filteredContext}\n\n`;
      }
    }

    fullPrompt += `User Request:\n${userPrompt}`;

    return fullPrompt;
  }

  /**
   * Update persona
   */
  updatePersona(id: string, updates: Partial<Persona>): void {
    const persona = this.personas.get(id);
    if (persona) {
      Object.assign(persona, updates, { updatedAt: new Date() });
      this.notifyStatusChange();
    }
  }

  /**
   * Delete persona
   */
  deletePersona(id: string): void {
    this.personas.delete(id);
    // Remove from active personas
    for (const [key, config] of this.activePersonas.entries()) {
      if (config.personaId === id) {
        this.activePersonas.delete(key);
      }
    }
    this.notifyStatusChange();
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (personas: Persona[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const personas = this.getAllPersonas();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(personas);
      } catch (error) {
        console.error('[PersonaSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const personaSystem = new PersonaSystem();

