/**
 * Reaperspace System
 * 
 * Manages data persistence, serialization, and organization.
 * Part of the VectorForge Framework - handles data lifecycle.
 */

export interface ReaperEntity {
  id: string;
  type: string;
  data: any;
  tags: string[];
  metadata: ReaperMetadata;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface ReaperMetadata {
  version: number;
  source: string;
  checksum?: string;
  size?: number;
  dependencies?: string[];
}

export interface ReaperQuery {
  type?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  metadata?: Partial<ReaperMetadata>;
}

export class Reaperspace {
  private entities: Map<string, ReaperEntity> = new Map();
  private indexes: Map<string, Set<string>> = new Map(); // tag -> entity IDs
  private typeIndexes: Map<string, Set<string>> = new Map(); // type -> entity IDs
  private statusCallbacks: Set<(entities: ReaperEntity[]) => void> = new Set();

  constructor() {
    // Initialize indexes
  }

  /**
   * Store an entity in reaperspace
   */
  store(entity: Omit<ReaperEntity, 'id' | 'createdAt' | 'updatedAt'>): ReaperEntity {
    const newEntity: ReaperEntity = {
      ...entity,
      id: `reaper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entities.set(newEntity.id, newEntity);
    this.updateIndexes(newEntity);
    this.notifyStatusChange();
    return newEntity;
  }

  /**
   * Get entity by ID
   */
  get(id: string): ReaperEntity | undefined {
    return this.entities.get(id);
  }

  /**
   * Query entities
   */
  query(query: ReaperQuery): ReaperEntity[] {
    let results = Array.from(this.entities.values());

    // Filter by type
    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(e => 
        query.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Filter by date range
    if (query.dateRange) {
      results = results.filter(e => {
        const created = e.createdAt.getTime();
        const start = query.dateRange!.start.getTime();
        const end = query.dateRange!.end.getTime();
        return created >= start && created <= end;
      });
    }

    // Filter by metadata
    if (query.metadata) {
      results = results.filter(e => {
        const meta = query.metadata!;
        return Object.keys(meta).every(key => {
          return e.metadata[key as keyof ReaperMetadata] === meta[key as keyof ReaperMetadata];
        });
      });
    }

    return results;
  }

  /**
   * Update entity
   */
  update(id: string, updates: Partial<ReaperEntity>): void {
    const entity = this.entities.get(id);
    if (entity) {
      // Remove from old indexes
      this.removeFromIndexes(entity);

      // Update entity
      Object.assign(entity, updates, { updatedAt: new Date() });

      // Add to new indexes
      this.updateIndexes(entity);
      this.notifyStatusChange();
    }
  }

  /**
   * Archive entity
   */
  archive(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.archivedAt = new Date();
      this.update(id, entity);
    }
  }

  /**
   * Delete entity
   */
  delete(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.removeFromIndexes(entity);
      this.entities.delete(id);
      this.notifyStatusChange();
    }
  }

  /**
   * Get all entities
   */
  getAll(): ReaperEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities by type
   */
  getByType(type: string): ReaperEntity[] {
    return this.query({ type });
  }

  /**
   * Get entities by tag
   */
  getByTag(tag: string): ReaperEntity[] {
    const entityIds = this.indexes.get(tag);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map(id => this.entities.get(id))
      .filter((e): e is ReaperEntity => e !== undefined);
  }

  /**
   * Update indexes
   */
  private updateIndexes(entity: ReaperEntity): void {
    // Update tag index
    entity.tags.forEach(tag => {
      if (!this.indexes.has(tag)) {
        this.indexes.set(tag, new Set());
      }
      this.indexes.get(tag)!.add(entity.id);
    });

    // Update type index
    if (!this.typeIndexes.has(entity.type)) {
      this.typeIndexes.set(entity.type, new Set());
    }
    this.typeIndexes.get(entity.type)!.add(entity.id);
  }

  /**
   * Remove from indexes
   */
  private removeFromIndexes(entity: ReaperEntity): void {
    // Remove from tag indexes
    entity.tags.forEach(tag => {
      const index = this.indexes.get(tag);
      if (index) {
        index.delete(entity.id);
        if (index.size === 0) {
          this.indexes.delete(tag);
        }
      }
    });

    // Remove from type index
    const typeIndex = this.typeIndexes.get(entity.type);
    if (typeIndex) {
      typeIndex.delete(entity.id);
      if (typeIndex.size === 0) {
        this.typeIndexes.delete(entity.type);
      }
    }
  }

  /**
   * Get all tags
   */
  getAllTags(): string[] {
    return Array.from(this.indexes.keys());
  }

  /**
   * Get all types
   */
  getAllTypes(): string[] {
    return Array.from(this.typeIndexes.keys());
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (entities: ReaperEntity[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const entities = this.getAll();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(entities);
      } catch (error) {
        console.error('[Reaperspace] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const reaperspace = new Reaperspace();

