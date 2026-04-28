import { useState } from 'react';
import ProductGrid from './ProductGrid';
import { sampleProducts, filterProducts, sortProducts } from '../data/sampleProducts';
import { Filter, SortAsc } from 'lucide-react';

export default function ProductGridDemo() {
  const [products, setProducts] = useState(sampleProducts);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 500,
    minRating: 0,
    inStockOnly: false,
  });
  const [columns, setColumns] = useState({
    desktop: 4,
    tablet: 2,
    mobile: 1,
  });

  const handleSort = (newSortBy) => {
    setSortBy(newSortBy);
    setProducts(sortProducts(products, newSortBy));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const filtered = filterProducts(sampleProducts, newFilters);
    const sorted = sortProducts(filtered, sortBy);
    setProducts(sorted);
  };

  const handleAddToCart = (product) => {
    alert(`Added "${product.name}" to cart!`);
    console.log('Add to cart:', product);
  };

  const handleViewProduct = (product) => {
    alert(`Viewing product: ${product.name}\nPrice: $${product.price}`);
    console.log('View product:', product);
  };

  const handleColumnsChange = (newColumns) => {
    setColumns(newColumns);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Showcase</h1>
          <p className="text-gray-600">Browse our collection of premium tech products</p>
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          {/* Sort and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc size={20} className="text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>

            {/* Product Count */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{products.length}</span> products
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Filter Products</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600">Min: ${filters.minPrice}</label>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            minPrice: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max: ${filters.maxPrice}</label>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            maxPrice: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        minRating: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">All Ratings</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>

                {/* Stock Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.inStockOnly}
                      onChange={(e) =>
                        handleFilterChange({
                          ...filters,
                          inStockOnly: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          onAddToCart={handleAddToCart}
          onViewProduct={handleViewProduct}
          showRating={true}
          showDiscount={true}
          desktopColumns={columns.desktop}
          tabletColumns={columns.tablet}
          mobileColumns={columns.mobile}
          onColumnsChange={handleColumnsChange}
          isEditing={true}
        />
      </div>
    </div>
  );
}
