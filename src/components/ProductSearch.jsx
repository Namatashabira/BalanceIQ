import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, RefreshCw, Package } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchWithAuth } from '../api';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

export default function ProductSearch({ onProductSelect, placeholder = "Search products...", onRefresh }) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProducts(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Re-fetch products when page becomes visible (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };

      // Fetch all products; default to public user_view to avoid tenant binding errors
      const url = `http://127.0.0.1:8000/api/products/?user_view=true&t=${Date.now()}`;
      console.log('Fetching products from API...');
      let response = await fetchWithAuth(url, { headers });

      // Fallback: if backend still returns 500 (e.g., due to auth tenant issues), retry without auth
      if (response && response.status >= 500) {
        console.warn('Products API 5xx with auth; retrying without auth');
        response = await fetch(url, { headers });
      }

      if (!response || !response.ok) {
        throw new Error('Failed to load products');
      }

      const data = await response.json();
      console.log('✅ Fetched products:', data.length, 'products');
      console.log('Sample products:', data.slice(0, 3).map(p => ({ id: p.id, name: p.name, category: p.category })));
      
      // Sort products: active first, then by name
      const sortedProducts = data.sort((a, b) => {
        // Active products first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        // Then sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      setProducts(sortedProducts);
      setLastRefresh(new Date());
      console.log('✅ Products state updated with', sortedProducts.length, 'products');
      
      if (onRefresh) {
        onRefresh(sortedProducts.length);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server');
        console.error('Request:', error.request);
      } else {
        console.error('Error details:', error);
      }
      
      // Don't redirect to login for permission issues since API has AllowAny
      toast.error(`Failed to fetch products: ${error.message}. Please check if the backend server is running.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchProducts(true);
  };

  // Filter products based on search term with debouncing
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setShowDropdown(false);
    } else {
      // Debounce search to avoid too many renders
      searchTimeoutRef.current = setTimeout(() => {
        const searchLower = searchTerm.toLowerCase().trim();
        console.log('Searching for:', searchLower);
        console.log('Total products available:', products.length);
        
        const filtered = products.filter(product => {
          const nameMatch = product.name && product.name.toLowerCase().includes(searchLower);
          const categoryMatch = product.category && product.category.toLowerCase().includes(searchLower);
          const statusMatch = product.status && product.status.toLowerCase().includes(searchLower);
          const skuMatch = product.sku && product.sku.toLowerCase().includes(searchLower);
          
          return nameMatch || categoryMatch || statusMatch || skuMatch;
        });
        
        console.log('Filtered results:', filtered.length);
        console.log('Sample matches:', filtered.slice(0, 3).map(p => p.name));
        
        // Limit to top 50 results for performance
        setFilteredProducts(filtered.slice(0, 50));
        setShowDropdown(true);
      }, 200);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, products]);

  const handleProductSelect = (product) => {
    onProductSelect(product);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowDropdown(false);
  };

  const normalizeImageUrl = (url) => {
    if (!url) return null;
    if (typeof url === 'string' && url.startsWith('/')) {
      return 'http://127.0.0.1:8000' + url;
    }
    return url;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      'out of stock': 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      'low stock': 'bg-yellow-100 text-yellow-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStockInfo = (product) => {
    if (product.status === 'out of stock' || product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', icon: '🚫' };
    } else if (product.status === 'low stock') {
      return { text: `Low Stock: ${product.stock} units`, color: 'text-yellow-600', icon: '⚠️' };
    } else if (product.status === 'expired') {
      return { text: 'Expired', color: 'text-gray-600', icon: '⏰' };
    } else {
      return { text: `In Stock: ${product.stock || 0} units`, color: 'text-green-600', icon: '✓' };
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex gap-2 items-center mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            placeholder={loading ? "Loading products..." : placeholder}
            disabled={loading}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
          {loading && !refreshing && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <RefreshCw size={20} className="animate-spin text-blue-600" />
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh products"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
      {lastRefresh && (
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
          <Package size={14} />
          <span>{products.length} total products in database</span>
          <span>•</span>
          <span>Last synced: {lastRefresh.toLocaleTimeString()}</span>
          {filteredProducts.length > 0 && searchTerm && (
            <>
              <span>•</span>
              <span>{filteredProducts.length} matches found</span>
            </>
          )}
        </div>
      )}

      {!lastRefresh && !loading && (
        <div className="text-xs text-yellow-600 mb-2 flex items-center gap-2">
          ⚠️ Products not loaded yet. Click refresh or wait...
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading products...</div>
          ) : filteredProducts.length > 0 ? (
            <>
              {filteredProducts.length === 50 && (
                <div className="p-2 bg-blue-50 text-blue-700 text-sm text-center border-b">
                  Showing top 50 results. Type more to refine search.
                </div>
              )}
              {filteredProducts.map((product) => {
                const stockInfo = getStockInfo(product);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <img
                      src={normalizeImageUrl(product.image) || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{product.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {product.category || 'Uncategorized'}
                        {product.sku && ` • SKU: ${product.sku}`}
                      </p>
                      <div className="flex gap-4 mt-1 text-sm items-center">
                        <span className="text-green-600 font-medium">
                          Retail: {fmt(parseFloat(product.retail_price || product.price || 0))}
                        </span>
                        {product.wholesale_price && (
                          <span className="text-blue-600 font-medium">
                            Wholesale: {fmt(parseFloat(product.wholesale_price || 0))}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${stockInfo.color} font-medium`}>
                          <span>{stockInfo.icon}</span>
                          <span>{stockInfo.text}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-4 text-center">
              <div className="text-gray-500 mb-2">
                No products found matching "{searchTerm}"
              </div>
              <div className="text-sm text-gray-400">
                Total products in database: {products.length}
              </div>
              {products.length === 0 && (
                <button 
                  onClick={handleRefresh}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Load Products
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
