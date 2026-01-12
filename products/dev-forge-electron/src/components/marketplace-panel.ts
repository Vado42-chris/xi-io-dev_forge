/**
 * Marketplace Panel Component
 * 
 * UI component for browsing and purchasing extensions.
 */

import { MarketplaceSystem, Product, Purchase } from '../systems/marketplace-system';

export class MarketplacePanel {
  private container: HTMLElement;
  private marketplaceSystem: MarketplaceSystem;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, marketplaceSystem: MarketplaceSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.marketplaceSystem = marketplaceSystem;
  }

  /**
   * Render the marketplace panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="marketplace-panel">
        <div class="marketplace-panel-header">
          <h3>MARKETPLACE</h3>
          <button id="refresh-marketplace" class="icon-button" title="Refresh">🔄</button>
        </div>
        <div class="marketplace-panel-content">
          <div class="marketplace-filters">
            <input type="text" id="marketplace-search" placeholder="Search extensions..." class="search-input">
            <select id="marketplace-category" class="filter-select">
              <option value="">All Categories</option>
              <option value="extension">Extensions</option>
              <option value="theme">Themes</option>
              <option value="plugin">Plugins</option>
              <option value="template">Templates</option>
            </select>
            <select id="marketplace-sort" class="filter-select">
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Rating</option>
              <option value="price">Price</option>
            </select>
          </div>
          <div id="marketplace-products" class="marketplace-products">
            <!-- Products will be rendered here -->
          </div>
        </div>
        <div class="marketplace-panel-footer">
          <button id="my-purchases" class="btn-secondary btn-small">My Purchases</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.marketplaceSystem.onStatusChange((products) => {
      this.renderProducts(products);
    });

    // Initial render
    this.renderProducts(this.marketplaceSystem.getAllProducts());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Search input
    const searchInput = this.container.querySelector('#marketplace-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProducts();
      });
    }

    // Category filter
    const categoryFilter = this.container.querySelector('#marketplace-category');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        this.filterProducts();
      });
    }

    // Sort filter
    const sortFilter = this.container.querySelector('#marketplace-sort');
    if (sortFilter) {
      sortFilter.addEventListener('change', () => {
        this.filterProducts();
      });
    }

    // Refresh button
    const refreshBtn = this.container.querySelector('#refresh-marketplace');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderProducts(this.marketplaceSystem.getAllProducts());
      });
    }

    // My purchases button
    const purchasesBtn = this.container.querySelector('#my-purchases');
    if (purchasesBtn) {
      purchasesBtn.addEventListener('click', () => {
        this.showPurchases();
      });
    }
  }

  /**
   * Filter products
   */
  private filterProducts(): void {
    const searchInput = this.container.querySelector('#marketplace-search') as HTMLInputElement;
    const categoryFilter = this.container.querySelector('#marketplace-category') as HTMLSelectElement;
    const sortFilter = this.container.querySelector('#marketplace-sort') as HTMLSelectElement;

    const query = {
      search: searchInput?.value || undefined,
      category: categoryFilter?.value || undefined,
      sortBy: (sortFilter?.value as any) || 'popular',
    };

    const products = this.marketplaceSystem.queryProducts(query);
    this.renderProducts(products);
  }

  /**
   * Render products
   */
  private renderProducts(products: Product[]): void {
    const productsContainer = this.container.querySelector('#marketplace-products');
    if (!productsContainer) return;

    if (products.length === 0) {
      productsContainer.innerHTML = '<div class="empty-state">No products found</div>';
      return;
    }

    productsContainer.innerHTML = products.map(product => this.renderProductCard(product)).join('');
    
    // Set up product card event listeners
    products.forEach(product => {
      const card = this.container.querySelector(`[data-product-id="${product.id}"]`);
      if (card) {
        // Purchase button
        const purchaseBtn = card.querySelector('.purchase-product');
        if (purchaseBtn) {
          purchaseBtn.addEventListener('click', () => {
            this.purchaseProduct(product.id);
          });
        }

        // View details button
        const viewBtn = card.querySelector('.view-product-details');
        if (viewBtn) {
          viewBtn.addEventListener('click', () => {
            this.showProductDetails(product.id);
          });
        }
      }
    });
  }

  /**
   * Render product card
   */
  private renderProductCard(product: Product): string {
    const priceDisplay = product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`;
    const ratingDisplay = product.rating > 0 ? `${product.rating.toFixed(1)} ⭐` : 'No ratings';

    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-card-header">
          <span class="product-name">${product.name}</span>
          <span class="product-price">${priceDisplay}</span>
        </div>
        <div class="product-card-body">
          <p class="product-description">${product.description}</p>
          <div class="product-meta">
            <span class="product-author">by ${product.author}</span>
            <span class="product-rating">${ratingDisplay}</span>
            <span class="product-downloads">${product.downloads} downloads</span>
          </div>
          <div class="product-tags">
            ${product.tags.map(tag => `<span class="product-tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="product-card-footer">
          <button class="view-product-details btn-secondary btn-small">Details</button>
          <button class="purchase-product btn-primary btn-small">${product.price === 0 ? 'Install' : 'Purchase'}</button>
        </div>
      </div>
    `;
  }

  /**
   * Purchase product
   */
  private purchaseProduct(productId: string): void {
    try {
      // TODO: Get actual user ID
      const userId = 'user-1';
      const purchase = this.marketplaceSystem.purchaseProduct(productId, userId);
      
      if (purchase.status === 'pending') {
        // TODO: Process payment if price > 0
        if (purchase.price === 0) {
          this.marketplaceSystem.completePurchase(purchase.id, 'free');
          alert(`Product installed successfully!${purchase.licenseKey ? `\nLicense Key: ${purchase.licenseKey}` : ''}`);
        } else {
          alert(`Purchase initiated. Transaction ID: ${purchase.id}`);
        }
      }
    } catch (error: any) {
      alert(`Error purchasing product: ${error.message}`);
    }
  }

  /**
   * Show product details
   */
  private showProductDetails(productId: string): void {
    // TODO: Implement product details view
    alert(`Product details for ${productId} - coming soon`);
  }

  /**
   * Show purchases
   */
  private showPurchases(): void {
    // TODO: Get actual user ID
    const userId = 'user-1';
    const purchases = this.marketplaceSystem.getUserPurchases(userId);
    
    if (purchases.length === 0) {
      alert('No purchases found');
      return;
    }

    const purchasesList = purchases.map(p => {
      const product = this.marketplaceSystem.getProduct(p.productId);
      return `- ${product?.name || p.productId} (${p.status})`;
    }).join('\n');

    alert(`My Purchases:\n${purchasesList}`);
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

