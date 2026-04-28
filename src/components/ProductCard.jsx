import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { ProductImageDisplay } from './ImageDisplayStyles';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

/**
 * ProductCard - Displays a single product with image gallery, pricing, and purchase options
 * Responsive and uses configurable display styles
 */
export function ProductCard({ product = {}, onAddToCart = () => {} }) {
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  // Extract product data with fallbacks
  const {
    id,
    name = 'Product',
    short_description = product.shortDescription || '',
    full_description = product.fullDescription || '',
    price = 0,
    retail_price = product.retailPrice || price,
    wholesale_price = product.wholesalePrice || price,
    stock = 0,
    images = [],
    image = null,
    image_display_style = 'carousel',
    display_settings = {},
    status = 'active',
  } = product;

  const displaySettings = {
    label_retail_price: 'Retail Price',
    label_wholesale_price: 'Wholesale Price',
    label_details_show: 'Details',
    label_details_hide: 'Hide',
    label_retail_button: 'Buy Retail',
    label_wholesale_button: 'Buy Wholesale',
    label_add_to_cart: 'Add to Cart',
    label_out_of_stock: 'Out of stock',
    ...display_settings,
  };

  // Get image list, preferring images array but falling back to single image
  const imageList = (images && images.length > 0) ? images : (image ? [image] : []);

  const isOutOfStock = stock <= 0;
  const displayStyle = image_display_style || 'carousel';

  const handleAddToCart = (purchaseType) => {
    if (quantity > 0 && !isOutOfStock) {
      onAddToCart({
        id,
        name,
        quantity,
        price: purchaseType === 'wholesale' ? wholesale_price : retail_price,
        purchaseType,
      });
      setQuantity(1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
      {/* Product Image Section */}
      <div className="relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <ProductImageDisplay
          images={imageList}
          displayStyle={displayStyle}
          isMobile={false}
        />

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {displaySettings.label_out_of_stock}
          </div>
        )}

        {/* Status Badge */}
        {status !== 'active' && (
          <div className="absolute top-3 left-3 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Unavailable
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {name}
        </h3>

        {/* Short Description */}
        {short_description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {short_description}
          </p>
        )}

        {/* Pricing */}
        <div className="space-y-1 mb-4 py-3 border-t border-b border-gray-200 dark:border-gray-700">
          {retail_price > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {displaySettings.label_retail_price}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {fmt(parseFloat(retail_price || 0))}
              </span>
            </div>
          )}
          {wholesale_price > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {displaySettings.label_wholesale_price}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {fmt(parseFloat(wholesale_price || 0))}
              </span>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div
          className={`text-center text-sm font-semibold py-2 rounded mb-4 ${
            isOutOfStock
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {isOutOfStock ? displaySettings.label_out_of_stock : `${stock} in stock`}
        </div>

        {/* Quantity Selector */}
        {!isOutOfStock && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">Quantity:</span>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Purchase Buttons */}
        {!isOutOfStock ? (
          <div className="space-y-2 mt-auto">
            <button
              onClick={() => handleAddToCart('retail')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {displaySettings.label_retail_button}
            </button>
            <button
              onClick={() => handleAddToCart('wholesale')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {displaySettings.label_wholesale_button}
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-semibold py-2 rounded-lg cursor-not-allowed"
          >
            {displaySettings.label_out_of_stock}
          </button>
        )}

        {/* Details Toggle */}
        {full_description && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showDetails ? displaySettings.label_details_hide : displaySettings.label_details_show}
          </button>
        )}
      </div>

      {/* Details Section */}
      {showDetails && full_description && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {full_description}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * ProductGrid - Grid layout for displaying multiple products
 */
export function ProductGrid({ products = [], onAddToCart = () => {}, columns = 3 }) {
  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

/**
 * ProductCarousel - Carousel/slider layout for featured products
 */
export function ProductCarousel({ products = [], onAddToCart = () => {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (products.length === 0) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">No products available</p>
      </div>
    );
  }

  const visibleProducts = [
    products[currentIndex],
    products[(currentIndex + 1) % products.length],
    products[(currentIndex + 2) % products.length],
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleProducts.map((product, idx) => (
          <div
            key={product.id}
            className={`transition-all duration-300 ${
              idx === 0 ? 'scale-100' : idx === 1 ? 'scale-95 opacity-75' : 'hidden md:block scale-90 opacity-50'
            }`}
          >
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {products.length > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevSlide}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Previous product"
          >
            ←
          </button>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {products.length}
          </div>
          <button
            onClick={nextSlide}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Next product"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
