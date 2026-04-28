import React, { useCallback } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

export default function ManualOrderCart({ cartItems, onUpdateQuantity, onRemove, onClear, onCheckout }) {
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const basePrice = item.priceType === 'wholesale' && item.product.wholesale_price
        ? item.product.wholesale_price
        : (item.product.retail_price || item.product.price || 0);
      const price = Number(basePrice) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  if (cartItems.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <ShoppingCart className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-500">No products added yet</p>
        <p className="text-sm text-gray-400 mt-1">Search and add products to create an order</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart size={20} />
          Cart Summary ({cartItems.length} items)
        </h3>
        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
        {cartItems.map((item) => {
          const basePrice = item.priceType === 'wholesale' && item.product.wholesale_price
            ? item.product.wholesale_price
            : (item.product.retail_price || item.product.price || 0);
          const price = Number(basePrice) || 0;
          const qty = Number(item.quantity) || 0;
          const total = price * qty;

          return (
            <div key={item.id} className="border-b border-gray-100 pb-3 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.product.name}</h4>
                  <p className="text-sm text-gray-500">
                      {item.priceType === 'wholesale' ? 'Wholesale' : 'Retail'} - {fmt(price)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-gray-800">{fmt(total)}</p>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-blue-600">{fmt(subtotal)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
