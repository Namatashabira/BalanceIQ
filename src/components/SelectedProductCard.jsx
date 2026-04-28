import React, { useCallback } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

export default function SelectedProductCard({ product, quantity, onQuantityChange, onRemove, priceType }) {
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const normalizeImageUrl = (url) => {
    if (!url) return null;
    if (typeof url === 'string' && url.startsWith('/')) {
      return 'http://127.0.0.1:8000' + url;
    }
    return url;
  };

  const getPrice = () => {
    if (priceType === 'wholesale' && product.wholesale_price) {
      return Number(product.wholesale_price) || 0;
    }
    return Number(product.retail_price || product.price || 0) || 0;
  };

  const price = getPrice();
  const qty = Number(quantity) || 0;
  const total = price * qty;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={normalizeImageUrl(product.image) || '/placeholder-product.png'}
            alt={product.name}
            className="w-24 h-24 object-cover rounded"
            onError={(e) => {
              e.target.src = '/placeholder-product.png';
            }}
          />
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
            </div>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove product"
            >
              <X size={20} />
            </button>
          </div>

          {/* Pricing Information */}
          <div className="mt-2 space-y-1">
            <div className="flex gap-4 text-sm">
              <span className="text-gray-600">
                Retail: <span className="font-medium text-gray-800">{fmt(product.retail_price || product.price || 0)}</span>
              </span>
              {product.wholesale_price && (
                <span className="text-gray-600">
                  Wholesale: <span className="font-medium text-gray-800">{fmt(product.wholesale_price)}</span>
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-blue-600">
              Selected Price: {fmt(price)} ({priceType})
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border border-gray-300 rounded px-2 py-1"
              />
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-lg font-semibold text-gray-800">
              Total: {fmt(total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
