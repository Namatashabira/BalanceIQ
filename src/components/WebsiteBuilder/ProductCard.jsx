import { useState } from 'react';
import { Star, ShoppingCart, Eye, AlertCircle } from 'lucide-react';

export default function ProductCard({
  product,
  onAddToCart,
  onViewProduct,
  showRating = true,
  showDiscount = true,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    id,
    name,
    price,
    image,
    rating = 0,
    discount = 0,
    stock = 0,
    originalPrice = price,
  } = product;

  const isOutOfStock = stock === 0;
  const discountedPrice = originalPrice - (originalPrice * discount) / 100;
  const displayPrice = discount > 0 ? discountedPrice : price;

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={`${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square">
        {/* Discount Badge */}
        {showDiscount && discount > 0 && (
          <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="text-center">
              <AlertCircle size={32} className="text-white mx-auto mb-2" />
              <p className="text-white font-semibold">Out of Stock</p>
            </div>
          </div>
        )}

        {/* Product Image */}
        {!imageError ? (
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Image not found</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
          {name}
        </h3>

        {/* Rating */}
        {showRating && (
          <div className="mb-3">
            {renderStars(rating)}
          </div>
        )}

        {/* Price Section */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ${displayPrice.toFixed(2)}
          </span>
          {discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stock > 0 && stock < 10 && (
          <p className="text-xs text-orange-600 font-medium mb-3">
            Only {stock} left in stock
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onViewProduct?.(product)}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="View product details"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={() => onAddToCart?.(product)}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add to cart"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
