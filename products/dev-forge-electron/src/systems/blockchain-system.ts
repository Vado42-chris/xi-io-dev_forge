/**
 * Blockchain System
 * 
 * Manages blockchain for identity, ledger, and data integrity.
 * Part of the VectorForge Framework - ensures data trust and verification.
 */

export interface Block {
  index: number;
  timestamp: Date;
  data: BlockData;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface BlockData {
  type: 'identity' | 'transaction' | 'data' | 'verification';
  payload: any;
  metadata?: BlockMetadata;
}

export interface BlockMetadata {
  author?: string;
  signature?: string;
  version?: string;
  tags?: string[];
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount?: number;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface Identity {
  id: string;
  publicKey: string;
  name: string;
  metadata: IdentityMetadata;
  createdAt: Date;
  verified: boolean;
}

export interface IdentityMetadata {
  email?: string;
  role?: string;
  permissions?: string[];
  attributes?: Record<string, any>;
}

export class BlockchainSystem {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private identities: Map<string, Identity> = new Map();
  private difficulty: number = 4; // Number of leading zeros required in hash
  private statusCallbacks: Set<(chain: Block[]) => void> = new Set();

  constructor() {
    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create genesis block
   */
  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date(),
      data: {
        type: 'data',
        payload: { message: 'Genesis block for Dev Forge blockchain' },
      },
      previousHash: '0',
      hash: '',
      nonce: 0,
    };

    genesisBlock.hash = this.calculateHash(genesisBlock);
    this.chain.push(genesisBlock);
  }

  /**
   * Calculate hash for a block
   */
  private calculateHash(block: Block): string {
    const data = `${block.index}${block.timestamp}${JSON.stringify(block.data)}${block.previousHash}${block.nonce}`;
    // Simple hash function (in production, use crypto.createHash)
    return this.simpleHash(data);
  }

  /**
   * Simple hash function (for demo - use proper crypto in production)
   */
  private simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Mine a new block
   */
  mineBlock(data: BlockData): Block {
    const previousBlock = this.getLatestBlock();
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: new Date(),
      data,
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
    };

    // Proof of work
    while (!this.isValidHash(newBlock.hash)) {
      newBlock.nonce++;
      newBlock.hash = this.calculateHash(newBlock);
    }

    this.chain.push(newBlock);
    this.notifyStatusChange();
    return newBlock;
  }

  /**
   * Check if hash is valid (meets difficulty requirement)
   */
  private isValidHash(hash: string): boolean {
    return hash.substring(0, this.difficulty) === '0'.repeat(this.difficulty);
  }

  /**
   * Get latest block
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get all blocks
   */
  getAllBlocks(): Block[] {
    return [...this.chain];
  }

  /**
   * Get block by index
   */
  getBlock(index: number): Block | undefined {
    return this.chain[index];
  }

  /**
   * Verify blockchain integrity
   */
  verifyChain(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify hash
      const calculatedHash = this.calculateHash(currentBlock);
      if (currentBlock.hash !== calculatedHash) {
        errors.push(`Block ${i} hash is invalid`);
      }

      // Verify previous hash link
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(`Block ${i} previous hash is invalid`);
      }

      // Verify hash meets difficulty
      if (!this.isValidHash(currentBlock.hash)) {
        errors.push(`Block ${i} hash does not meet difficulty requirement`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create identity
   */
  createIdentity(identity: Omit<Identity, 'id' | 'createdAt'>): Identity {
    const newIdentity: Identity = {
      ...identity,
      id: `identity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.identities.set(newIdentity.id, newIdentity);

    // Record identity creation in blockchain
    this.mineBlock({
      type: 'identity',
      payload: {
        action: 'create',
        identityId: newIdentity.id,
        publicKey: newIdentity.publicKey,
      },
    });

    return newIdentity;
  }

  /**
   * Get identity
   */
  getIdentity(id: string): Identity | undefined {
    return this.identities.get(id);
  }

  /**
   * Verify identity
   */
  verifyIdentity(id: string): boolean {
    const identity = this.identities.get(id);
    if (!identity) return false;

    // Check blockchain for identity creation
    const identityBlocks = this.chain.filter(
      block => block.data.type === 'identity' &&
      block.data.payload.identityId === id
    );

    if (identityBlocks.length === 0) return false;

    identity.verified = true;
    return true;
  }

  /**
   * Add transaction
   */
  addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.pendingTransactions.push(newTransaction);
    return newTransaction;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  /**
   * Clear pending transactions (after mining)
   */
  clearPendingTransactions(): void {
    this.pendingTransactions = [];
  }

  /**
   * Get chain length
   */
  getChainLength(): number {
    return this.chain.length;
  }

  /**
   * Get chain statistics
   */
  getChainStats(): {
    length: number;
    totalTransactions: number;
    totalIdentities: number;
    verified: boolean;
    lastBlockTime: Date;
  } {
    const verification = this.verifyChain();
    const transactionBlocks = this.chain.filter(b => b.data.type === 'transaction');
    const identityBlocks = this.chain.filter(b => b.data.type === 'identity');

    return {
      length: this.chain.length,
      totalTransactions: transactionBlocks.length,
      totalIdentities: identityBlocks.length,
      verified: verification.valid,
      lastBlockTime: this.getLatestBlock().timestamp,
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (chain: Block[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const chain = this.getAllBlocks();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(chain);
      } catch (error) {
        console.error('[BlockchainSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const blockchainSystem = new BlockchainSystem();

