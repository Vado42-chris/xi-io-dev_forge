/**
 * Marketplace System
 * 
 * Manages extension marketplace, products, and purchases.
 * Part of the VectorForge Framework - enables extension distribution.
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  price: number;
  currency: string;
  type: 'extension' | 'theme' | 'plugin' | 'template';
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  icon?: string;
  screenshots?: string[];
}

export interface Purchase {
  id: string;
  productId: string;
  userId: string;
  price: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  purchasedAt: Date;
  licenseKey?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface MarketplaceQuery {
  category?: string;
  type?: string;
  tags?: string[];
  search?: string;
  minRating?: number;
  sortBy?: 'popular' | 'newest' | 'rating' | 'price';
  priceRange?: { min: number; max: number };
}

export class MarketplaceSystem {
  private products: Map<string, Product> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private reviews: Map<string, Review> = new Map();
  private statusCallbacks: Set<(products: Product[]) => void> = new Set();

  constructor() {
    this.initializeDefaultProducts();
  }

  /**
   * Initialize default products
   */
  private initializeDefaultProducts(): void {
    const defaults: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'product-xibalba-theme',
        name: 'Xibalba Dark Theme',
        description: 'Official Xibalba Framework dark theme for Dev Forge',
        version: '1.0.0',
        author: 'Xibalba Mixed Media Studio',
        category: 'theme',
        price: 0,
        currency: 'USD',
        type: 'theme',
        tags: ['theme', 'xibalba', 'dark'],
        downloads: 0,
        rating: 0,
        reviews: 0,
        status: 'published',
      },
      {
        id: 'product-code-snippets',
        name: 'Code Snippets Extension',
        description: 'Collection of useful code snippets for common tasks',
        version: '1.0.0',
        author: 'Dev Forge Community',
        category: 'extension',
        price: 4.99,
        currency: 'USD',
        type: 'extension',
        tags: ['snippets', 'productivity', 'code'],
        downloads: 0,
        rating: 0,
        reviews: 0,
        status: 'published',
      },
    ];

    defaults.forEach(product => {
      this.createProduct(product);
    });
  }

  /**
   * Create a product
   */
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set(newProduct.id, newProduct);
    this.notifyStatusChange();
    return newProduct;
  }

  /**
   * Get all products
   */
  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  /**
   * Get product by ID
   */
  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  /**
   * Query products
   */
  queryProducts(query: MarketplaceQuery): Product[] {
    let results = this.getAllProducts().filter(p => p.status === 'published');

    // Filter by category
    if (query.category) {
      results = results.filter(p => p.category === query.category);
    }

    // Filter by type
    if (query.type) {
      results = results.filter(p => p.type === query.type);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(p => 
        query.tags!.some(tag => p.tags.includes(tag))
      );
    }

    // Search in name/description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by rating
    if (query.minRating) {
      results = results.filter(p => p.rating >= query.minRating!);
    }

    // Filter by price range
    if (query.priceRange) {
      results = results.filter(p => 
        p.price >= query.priceRange!.min && p.price <= query.priceRange!.max
      );
    }

    // Sort
    if (query.sortBy) {
      switch (query.sortBy) {
        case 'popular':
          results.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'newest':
          results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'rating':
          results.sort((a, b) => b.rating - a.rating);
          break;
        case 'price':
          results.sort((a, b) => a.price - b.price);
          break;
      }
    }

    return results;
  }

  /**
   * Update product
   */
  updateProduct(id: string, updates: Partial<Product>): void {
    const product = this.products.get(id);
    if (product) {
      Object.assign(product, updates, { updatedAt: new Date() });
      this.notifyStatusChange();
    }
  }

  /**
   * Delete product
   */
  deleteProduct(id: string): void {
    this.products.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Purchase a product
   */
  purchaseProduct(productId: string, userId: string): Purchase {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    if (product.status !== 'published') {
      throw new Error(`Product ${productId} is not available for purchase`);
    }

    const purchase: Purchase = {
      id: `purchase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      userId,
      price: product.price,
      currency: product.currency,
      status: 'pending',
      purchasedAt: new Date(),
      licenseKey: product.price > 0 ? this.generateLicenseKey() : undefined,
    };

    this.purchases.set(purchase.id, purchase);

    // Update product downloads
    product.downloads++;
    this.updateProduct(productId, product);

    return purchase;
  }

  /**
   * Complete purchase
   */
  completePurchase(purchaseId: string, transactionId: string): void {
    const purchase = this.purchases.get(purchaseId);
    if (purchase) {
      purchase.status = 'completed';
      purchase.transactionId = transactionId;
    }
  }

  /**
   * Get purchases for user
   */
  getUserPurchases(userId: string): Purchase[] {
    return Array.from(this.purchases.values()).filter(p => p.userId === userId);
  }

  /**
   * Add review
   */
  addReview(review: Omit<Review, 'id' | 'createdAt'>): Review {
    const newReview: Review = {
      ...review,
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.reviews.set(newReview.id, newReview);

    // Update product rating
    const product = this.products.get(review.productId);
    if (product) {
      const productReviews = this.getProductReviews(review.productId);
      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / productReviews.length;
      
      this.updateProduct(review.productId, {
        rating: averageRating,
        reviews: productReviews.length,
      });
    }

    return newReview;
  }

  /**
   * Get product reviews
   */
  getProductReviews(productId: string): Review[] {
    return Array.from(this.reviews.values()).filter(r => r.productId === productId);
  }

  /**
   * Generate license key
   */
  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(Math.random().toString(36).substr(2, 4).toUpperCase());
    }
    return segments.join('-');
  }

  /**
   * Get marketplace statistics
   */
  getMarketplaceStats(): {
    totalProducts: number;
    totalPurchases: number;
    totalRevenue: number;
    averageRating: number;
  } {
    const products = this.getAllProducts();
    const purchases = Array.from(this.purchases.values());
    const completedPurchases = purchases.filter(p => p.status === 'completed');
    const totalRevenue = completedPurchases.reduce((sum, p) => sum + p.price, 0);
    const averageRating = products.length > 0
      ? products.reduce((sum, p) => sum + p.rating, 0) / products.length
      : 0;

    return {
      totalProducts: products.length,
      totalPurchases: purchases.length,
      totalRevenue,
      averageRating,
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (products: Product[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const products = this.getAllProducts();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(products);
      } catch (error) {
        console.error('[MarketplaceSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const marketplaceSystem = new MarketplaceSystem();

