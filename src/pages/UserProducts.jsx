import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '../services/productAPI';
import { ProductCard, ProductGrid, ProductCarousel } from '../components/ProductCard';

/**
 * User Products Page - Displays products with responsive photo display styles
 */
export default function UserProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid, carousel, list
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const loadProducts = useCallback(async ({ background = false, signal } = {}) => {
    if (!background) setLoading(true);
    try {
      const data = await fetchProducts({ userView: true, signal });
      // Only show active products
      const activeProducts = data.filter((p) => p.status === 'active');
      setProducts(activeProducts);
    } catch (error) {
      if (signal?.aborted) return; // ignore aborted fetches
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  // Load products from backend on mount with abort safety
  useEffect(() => {
    const controller = new AbortController();
    loadProducts({ signal: controller.signal });
    return () => controller.abort();
  }, [loadProducts]);

  // Background refresh every 20s to pick up new/updated products without user action
  useEffect(() => {
    const interval = setInterval(() => {
      loadProducts({ background: true });
    }, 20000);
    return () => clearInterval(interval);
  }, [loadProducts]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadProducts({ background: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadProducts]);

  // Filter products
  const filteredProducts = products
    .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.short_description && p.short_description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Get unique categories
  const categories = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, item]);
    // Toast notification could go here
    console.log('Added to cart:', item);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Browse our collection of premium products with beautiful image galleries
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* View Mode Selector */}
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-semibold shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="Grid view"
                >
                  ⊞ Grid
                </button>
                <button
                  onClick={() => setViewMode('carousel')}
                  className={`px-4 py-1 rounded transition-colors ${
                    viewMode === 'carousel'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-semibold shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="Carousel view"
                >
                  ◀ Carousel ▶
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-1 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 font-semibold shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="List view"
                >
                  ≡ List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category === 'all' ? 'All Products' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Cart Summary</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Items: <span className="font-bold">{cart.length}</span>
                </p>
                <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors font-semibold text-sm">
                  View Cart
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Category Mobile Selector */}
            <div className="lg:hidden mb-6">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Products' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Select a different category or check back soon'}
                </p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> products
                  </p>
                </div>

                {/* Products View */}
                {viewMode === 'grid' && (
                  <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} columns={3} />
                )}

                {viewMode === 'carousel' && (
                  <ProductCarousel products={filteredProducts} onAddToCart={handleAddToCart} />
                )}

                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
