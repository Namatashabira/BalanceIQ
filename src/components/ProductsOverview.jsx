import { useState, useEffect, useCallback } from 'react';
import { Package, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { fetchProducts } from '../services/productAPI';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, getCurrencyCode } from '../utils/pricingHelpers';

export default function ProductsOverview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const currencyCode = getCurrencyCode(pricingSettings);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data.slice(0, 5)); // Show only top 5 products
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * Number(p.stock || 0)), 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Products Overview</h3>
          </div>
          <button 
            onClick={() => window.location.href = '/products'}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            View All
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProducts}</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Total Products</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalValue)}</div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Total Value ({currencyCode})</div>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockProducts}</div>
            <div className="text-xs text-amber-600/70 dark:text-amber-400/70">Low Stock</div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Products</h4>
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No products found</p>
              <button 
                onClick={() => window.location.href = '/products'}
                className="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
              >
                Add your first product
              </button>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-colors">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      {product.stock < 10 && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(parseFloat(product.price || 0))}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {product.stock}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}