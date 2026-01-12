/**
 * Serialized Hashtags System
 * 
 * Manages hashtag-based data organization and serialization.
 * Part of the VectorForge Framework - enables structured data tagging.
 */

export interface SerializedHashtag {
  tag: string;
  namespace?: string;
  metadata: HashtagMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface HashtagMetadata {
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  count?: number; // Number of entities using this tag
  parent?: string; // Parent tag for hierarchy
  children?: string[]; // Child tags
}

export interface HashtagQuery {
  namespace?: string;
  category?: string;
  parent?: string;
  search?: string;
}

export class SerializedHashtags {
  private hashtags: Map<string, SerializedHashtag> = new Map();
  private namespaceIndex: Map<string, Set<string>> = new Map(); // namespace -> tag names
  private categoryIndex: Map<string, Set<string>> = new Map(); // category -> tag names
  private statusCallbacks: Set<(hashtags: SerializedHashtag[]) => void> = new Set();

  constructor() {
    this.initializeDefaultHashtags();
  }

  /**
   * Initialize default hashtags
   */
  private initializeDefaultHashtags(): void {
    const defaults: Omit<SerializedHashtag, 'createdAt' | 'updatedAt'>[] = [
      {
        tag: '#dev-forge',
        namespace: 'system',
        metadata: {
          description: 'Dev Forge system tag',
          category: 'system',
          color: '#007acc',
        },
      },
      {
        tag: '#ai',
        namespace: 'feature',
        metadata: {
          description: 'AI-related content',
          category: 'feature',
          color: '#28a745',
        },
      },
      {
        tag: '#plugin',
        namespace: 'feature',
        metadata: {
          description: 'Plugin-related content',
          category: 'feature',
          color: '#ffc107',
        },
      },
      {
        tag: '#sprint',
        namespace: 'project',
        metadata: {
          description: 'Sprint-related content',
          category: 'project',
          color: '#17a2b8',
        },
      },
      {
        tag: '#persona',
        namespace: 'feature',
        metadata: {
          description: 'Persona-related content',
          category: 'feature',
          color: '#6f42c1',
        },
      },
    ];

    defaults.forEach(hashtag => {
      this.create(hashtag);
    });
  }

  /**
   * Create a hashtag
   */
  create(hashtag: Omit<SerializedHashtag, 'createdAt' | 'updatedAt'>): SerializedHashtag {
    const normalizedTag = this.normalizeTag(hashtag.tag);
    
    // Check if already exists
    if (this.hashtags.has(normalizedTag)) {
      throw new Error(`Hashtag ${normalizedTag} already exists`);
    }

    const newHashtag: SerializedHashtag = {
      ...hashtag,
      tag: normalizedTag,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.hashtags.set(normalizedTag, newHashtag);
    this.updateIndexes(newHashtag);
    this.notifyStatusChange();
    return newHashtag;
  }

  /**
   * Normalize tag (ensure # prefix, lowercase)
   */
  private normalizeTag(tag: string): string {
    let normalized = tag.trim().toLowerCase();
    if (!normalized.startsWith('#')) {
      normalized = '#' + normalized;
    }
    return normalized;
  }

  /**
   * Get hashtag
   */
  get(tag: string): SerializedHashtag | undefined {
    const normalized = this.normalizeTag(tag);
    return this.hashtags.get(normalized);
  }

  /**
   * Update hashtag
   */
  update(tag: string, updates: Partial<SerializedHashtag>): void {
    const normalized = this.normalizeTag(tag);
    const hashtag = this.hashtags.get(normalized);
    
    if (hashtag) {
      // Remove from old indexes
      this.removeFromIndexes(hashtag);

      // Update hashtag
      Object.assign(hashtag, updates, { updatedAt: new Date() });

      // Add to new indexes
      this.updateIndexes(hashtag);
      this.notifyStatusChange();
    }
  }

  /**
   * Delete hashtag
   */
  delete(tag: string): void {
    const normalized = this.normalizeTag(tag);
    const hashtag = this.hashtags.get(normalized);
    
    if (hashtag) {
      this.removeFromIndexes(hashtag);
      this.hashtags.delete(normalized);
      this.notifyStatusChange();
    }
  }

  /**
   * Query hashtags
   */
  query(query: HashtagQuery): SerializedHashtag[] {
    let results = Array.from(this.hashtags.values());

    // Filter by namespace
    if (query.namespace) {
      results = results.filter(h => h.namespace === query.namespace);
    }

    // Filter by category
    if (query.category) {
      results = results.filter(h => h.metadata.category === query.category);
    }

    // Filter by parent
    if (query.parent) {
      results = results.filter(h => h.metadata.parent === query.parent);
    }

    // Search in tag name or description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(h => 
        h.tag.toLowerCase().includes(searchLower) ||
        h.metadata.description?.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Get all hashtags
   */
  getAll(): SerializedHashtag[] {
    return Array.from(this.hashtags.values());
  }

  /**
   * Get hashtags by namespace
   */
  getByNamespace(namespace: string): SerializedHashtag[] {
    return this.query({ namespace });
  }

  /**
   * Get hashtags by category
   */
  getByCategory(category: string): SerializedHashtag[] {
    return this.query({ category });
  }

  /**
   * Increment usage count
   */
  incrementCount(tag: string): void {
    const normalized = this.normalizeTag(tag);
    const hashtag = this.hashtags.get(normalized);
    if (hashtag) {
      hashtag.metadata.count = (hashtag.metadata.count || 0) + 1;
      hashtag.updatedAt = new Date();
      this.notifyStatusChange();
    }
  }

  /**
   * Decrement usage count
   */
  decrementCount(tag: string): void {
    const normalized = this.normalizeTag(tag);
    const hashtag = this.hashtags.get(normalized);
    if (hashtag && hashtag.metadata.count) {
      hashtag.metadata.count = Math.max(0, hashtag.metadata.count - 1);
      hashtag.updatedAt = new Date();
      this.notifyStatusChange();
    }
  }

  /**
   * Parse hashtags from text
   */
  parseHashtags(text: string): string[] {
    const hashtagRegex = /#[\w-]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => this.normalizeTag(tag)) : [];
  }

  /**
   * Update indexes
   */
  private updateIndexes(hashtag: SerializedHashtag): void {
    // Update namespace index
    if (hashtag.namespace) {
      if (!this.namespaceIndex.has(hashtag.namespace)) {
        this.namespaceIndex.set(hashtag.namespace, new Set());
      }
      this.namespaceIndex.get(hashtag.namespace)!.add(hashtag.tag);
    }

    // Update category index
    if (hashtag.metadata.category) {
      if (!this.categoryIndex.has(hashtag.metadata.category)) {
        this.categoryIndex.set(hashtag.metadata.category, new Set());
      }
      this.categoryIndex.get(hashtag.metadata.category)!.add(hashtag.tag);
    }
  }

  /**
   * Remove from indexes
   */
  private removeFromIndexes(hashtag: SerializedHashtag): void {
    // Remove from namespace index
    if (hashtag.namespace) {
      const index = this.namespaceIndex.get(hashtag.namespace);
      if (index) {
        index.delete(hashtag.tag);
        if (index.size === 0) {
          this.namespaceIndex.delete(hashtag.namespace);
        }
      }
    }

    // Remove from category index
    if (hashtag.metadata.category) {
      const index = this.categoryIndex.get(hashtag.metadata.category);
      if (index) {
        index.delete(hashtag.tag);
        if (index.size === 0) {
          this.categoryIndex.delete(hashtag.metadata.category);
        }
      }
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (hashtags: SerializedHashtag[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const hashtags = this.getAll();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(hashtags);
      } catch (error) {
        console.error('[SerializedHashtags] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const serializedHashtags = new SerializedHashtags();

