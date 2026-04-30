import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Plus, X, Trash2 } from 'lucide-react';
import ProductSearch from '../components/ProductSearch';
import SelectedProductCard from '../components/SelectedProductCard';
import CheckoutModal from '../components/CheckoutModal';
import Receipt from '../components/Receipt';
import Invoice from '../components/Invoice';
import { useConfig } from '../context/ConfigContext';
import { selectUnitPrice, computeTax, defaultPricingSettings, formatCurrency, getCurrencyCode, isWholesaleEligible } from '../utils/pricingHelpers';

export default function ManualOrderEntry() {
  const API_URL = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/core`;
  const CART_STORAGE_KEY = 'manualOrder.cartItems';
  const SELECTION_STORAGE_KEY = 'manualOrder.selectedProducts';
  const { pricingSettings } = useConfig();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showFullCartModal, setShowFullCartModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [autoRefresh] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [debtCustomerName, setDebtCustomerName] = useState('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState('');
  const [debtAmountPaid, setDebtAmountPaid] = useState('');
  const [debtProductIds, setDebtProductIds] = useState([]);
  const [debtPartialPaymentMethod, setDebtPartialPaymentMethod] = useState('');
  const [debtPartialMobileNumber, setDebtPartialMobileNumber] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const fullCartRef = useRef(null);
  const paymentSectionRef = useRef(null);

  // Auto-refresh products every 30 seconds if enabled
    // Listen for product load event from ProductSearch
    const handleProductsLoaded = () => {
      setProductsLoaded(true);
    };
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refresh check...');
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Rehydrate last selections/cart on mount
  useEffect(() => {
    try {
      const storedSelections = JSON.parse(localStorage.getItem(SELECTION_STORAGE_KEY) || '[]');
      const sanitizedSelections = (storedSelections || []).map(sanitizeSelection).filter(Boolean);
      if (sanitizedSelections.length) {
        setSelectedProducts(sanitizedSelections);
      }

      const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      const sanitizedCart = (storedCart || []).map(sanitizeCartItem).filter(Boolean);
      if (sanitizedCart.length) {
        setCartItems(sanitizedCart);
      }
    } catch (error) {
      console.error('Error restoring manual order state:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist selections
  useEffect(() => {
    try {
      localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedProducts));
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  }, [selectedProducts]);

  // Persist cart items
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fullCartRef.current && !fullCartRef.current.contains(e.target)) {
        setShowFullCartModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to check if user is authenticated (token exists)
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const currencyCode = getCurrencyCode(pricingSettings);
  const fmt = (value) => formatCurrency(value, pricingSettings);

  const sanitizeSelection = (entry) => {
    if (!entry || !entry.product) return null;
    const quantity = Math.max(1, Number(entry.quantity) || 1);
    const priceType = entry.priceType === 'wholesale' && entry.product.wholesale_price ? 'wholesale' : 'retail';
    return {
      id: entry.id || entry.product.id,
      product: entry.product,
      quantity,
      priceType,
    };
  };

  const sanitizeCartItem = (entry) => {
    if (!entry || !entry.product) return null;
    const quantity = Math.max(1, Number(entry.quantity) || 1);
    const priceType = entry.priceType === 'wholesale' && entry.product.wholesale_price ? 'wholesale' : 'retail';
    return {
      id: entry.id || `${entry.product.id}-${priceType}`,
      product: entry.product,
      quantity,
      priceType,
    };
  };

  const buildAuthHeaders = () => {
    if (!isAuthenticated) return {};
    return { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
  };

  const saveCustomerRecord = async ({ name, phone, email, location }) => {
    if (!isAuthenticated) return;
    if (!name && !phone && !email && !location) return;
    try {
      await fetch(`${API_URL}/customers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
        },
        body: JSON.stringify({ name, phone, email, location }),
      });
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const calculateTotals = () => {
    let subTotal = 0;
    for (const item of cartItems) {
      const { unitPrice, blocked, reason } = selectUnitPrice(
        item.product,
        item.quantity,
        pricingSettings,
        item.priceType
      );
      if (blocked) continue;
      subTotal += unitPrice * item.quantity;
    }
    const { tax: taxAmount, total: totalAmount } = computeTax(subTotal, pricingSettings);
    const amountPaid = paymentMethod === 'debt' ? parseFloat(debtAmountPaid || 0) : totalAmount;
    const debtAmount = totalAmount - amountPaid;
    return { subTotal, taxAmount, totalAmount, amountPaid, debtAmount };
  };

  const createOrderAndReceipt = async () => {
    const { subTotal, taxAmount, totalAmount, amountPaid, debtAmount } = calculateTotals();

    const resolvedName = paymentMethod === 'debt'
      ? (debtCustomerName || customerName || 'Walk-in Customer')
      : (customerName || 'Walk-in Customer');
    const resolvedPhone = paymentMethod === 'debt'
      ? (debtCustomerPhone || mobileMoneyNumber || customerPhone || '0000000000')
      : (customerPhone || mobileMoneyNumber || '0000000000');
    const resolvedEmail = paymentMethod === 'debt'
      ? (customerEmail || `${debtCustomerPhone || customerPhone || 'manual'}@manual.local`)
      : (customerEmail || `${(customerPhone || mobileMoneyNumber || 'manual')}@manual.local`);
    const resolvedLocation = customerLocation || 'Manual entry POS';

    const invalidPriceItem = cartItems.find(item => {
      const price = item.priceType === 'wholesale'
        ? Number(item.product.wholesale_price || 0)
        : Number(item.product.retail_price || item.product.price || 0);
      return !price || price <= 0;
    });

    if (invalidPriceItem) {
      throw new Error(`Missing price for ${invalidPriceItem.product?.name || 'item'}`);
    }

    const orderPayload = {
      customer_name: resolvedName,
      customer_email: resolvedEmail,
      phone_number: resolvedPhone,
      location: resolvedLocation,
      order_type: cartItems.some(item => item.priceType === 'wholesale') ? 'wholesale' : 'retail',
      delivery: false,
      order_source: 'manual',
      order_items: cartItems.map(item => ({
        product_name: item.product.name,
        quantity: item.quantity,
        price: selectUnitPrice(item.product, item.quantity, pricingSettings, item.priceType).unitPrice,
      })),
    };

    let createdOrderId = null;

    try {
      const orderResponse = await fetch(`${API_URL}/user/orders/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderResponse.ok) {
        const errorBody = await orderResponse.text();
        throw new Error(`Order create failed (${orderResponse.status}): ${errorBody}`);
      }

      const orderData = await orderResponse.json();
      createdOrderId = orderData.id || orderData?.order?.id || null;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }

      const receiptPayload = {
      customerName: resolvedName,
      customerPhone: resolvedPhone,
      customerEmail: resolvedEmail,
      customerLocation: resolvedLocation,
      paymentMethod,
      mobileMoneyNumber: paymentMethod === 'mobilemoney' ? mobileMoneyNumber : '',
      subTotal,
      taxAmount,
      totalAmount,
      amountPaid,
      debtAmount,
      debtPartialPaymentMethod: paymentMethod === 'debt' && amountPaid > 0 ? debtPartialPaymentMethod : '',
      debtPartialMobileNumber: paymentMethod === 'debt' && debtPartialPaymentMethod === 'mobilemoney' ? debtPartialMobileNumber : '',
      debtProductIds,
      items: cartItems.map(item => {
        const unitPrice = selectUnitPrice(item.product, item.quantity, pricingSettings, item.priceType).unitPrice;
        return {
          id: item.id,
          productName: item.product.name,
          quantity: item.quantity,
          priceType: item.priceType,
          unitPrice,
          totalPrice: item.quantity * unitPrice,
          isDebt: debtProductIds.includes(item.id),
        };
      }),
    };

    try {
      const receiptResponse = await fetch(`${API_URL}/receipts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(receiptPayload),
      });

      if (!receiptResponse.ok) {
        const errorBody = await receiptResponse.text();
        throw new Error(`Receipt save failed (${receiptResponse.status}): ${errorBody}`);
      }

      const receiptData = await receiptResponse.json();
      setReceiptNumber(receiptData.receiptNumber);

      await saveCustomerRecord({ name: resolvedName, phone: resolvedPhone, email: resolvedEmail, location: resolvedLocation });

      return { orderId: createdOrderId, receiptNumber: receiptData.receiptNumber };
    } catch (error) {
      console.error('Error saving receipt:', error);
      throw error;
    }
  };

  const handleCheckoutAndPrint = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'debt') {
      if (!debtCustomerName || !debtCustomerPhone || !debtAmountPaid) return;
      if (parseFloat(debtAmountPaid) >= 500 && !debtPartialPaymentMethod) return;
      if (debtPartialPaymentMethod === 'mobilemoney' && !debtPartialMobileNumber) return;
      // Save customer data to backend only if authenticated
      if (isAuthenticated) {
        try {
          await fetch(`${API_URL}/customers/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              name: debtCustomerName,
              phone: debtCustomerPhone,
            })
          });
        } catch (error) {
          console.error('Error saving customer:', error);
        }
      }
      // If amount paid is 0, show Invoice (all debt)
      if (parseFloat(debtAmountPaid) === 0) {
        setShowInvoice(true);
        return;
      }
    }
    try {
      const { orderId, receiptNumber: savedReceiptNumber } = await createOrderAndReceipt();
      if (orderId) {
        setSuccessMessage(`Order #${orderId} recorded. Receipt ${savedReceiptNumber || ''} saved.`);
      } else if (savedReceiptNumber) {
        setSuccessMessage(`Receipt ${savedReceiptNumber} saved.`);
      }
      setShowReceipt(true);
    } catch (error) {
      console.error('Failed to record order or receipt.');
    }
  };

  const handleCheckoutAndExit = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'debt') {
      if (!debtCustomerName || !debtCustomerPhone || !debtAmountPaid) return;
      if (parseFloat(debtAmountPaid) >= 500 && !debtPartialPaymentMethod) return;
      if (debtPartialPaymentMethod === 'mobilemoney' && !debtPartialMobileNumber) return;
      
      // Save customer data to backend if it's a debt transaction
      try {
        await fetch(`${API_URL}/customers/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: debtCustomerName,
            phone: debtCustomerPhone,
          })
        });
      } catch (error) {
        console.error('Error saving customer:', error);
      }
      
      // If amount paid is 0, show Invoice (all debt)
      if (parseFloat(debtAmountPaid) === 0) {
        setShowInvoice(true);
        return;
      }
    }
    // Show receipt for any payment
    setShowReceipt(true);
  };

  const handleProductSelect = (product) => {
    // Check if product already in selected list
    const exists = selectedProducts.find(p => p.id === product.id);
    if (exists) return;

    // Add product to selection list with default values
    const newSelection = {
      id: product.id,
      product: product,
      quantity: 1,
      priceType: 'retail'
    };
    setSelectedProducts(prev => [...prev, newSelection]);
  };

  const handleUpdateSelection = (productId, field, value) => {
    const threshold = pricingSettings?.wholesaleThreshold ?? defaultPricingSettings.wholesaleThreshold;

    setSelectedProducts(prev => prev.map(item => {
      if (item.id !== productId) return item;

      const next = { ...item };

      if (field === 'priceType') {
        next.priceType = value;
        if (value === 'wholesale') {
          const adjustedQty = Math.max(Number(next.quantity) || 1, threshold);
          next.quantity = adjustedQty;
        } else {
          next.quantity = Math.max(Number(next.quantity) || 1, 1);
        }
        return next;
      }

      if (field === 'quantity') {
        const parsed = Math.max(1, Number(value) || 1);
        const minQty = next.priceType === 'wholesale' ? threshold : 1;
        next.quantity = Math.max(parsed, minQty);
        return next;
      }

      next[field] = value;
      return next;
    }));
  };

  const handleRemoveSelection = (productId) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== productId));
  };

  const handleAddToCart = (selection) => {
    const { blocked, reason, unitPrice } = selectUnitPrice(selection.product, selection.quantity, pricingSettings, selection.priceType);
    if (blocked || !unitPrice || !Number.isFinite(unitPrice) || unitPrice <= 0) return;
    const cartItem = {
      id: `${selection.id}-${selection.priceType}-${Date.now()}`,
      product: selection.product,
      quantity: selection.quantity,
      priceType: selection.priceType
    };

    setCartItems(prev => [...prev, cartItem]);
    // Remove from selection after adding to cart
    handleRemoveSelection(selection.id);
  };

  const handleAddAllToCart = () => {
    if (selectedProducts.length === 0) return;

    const validItems = [];
    const skipped = [];
    const skippedSelections = [];

    selectedProducts.forEach(selection => {
      const { blocked, reason, unitPrice } = selectUnitPrice(selection.product, selection.quantity, pricingSettings, selection.priceType);
      if (blocked || !unitPrice || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        skipped.push(selection.product?.name || 'Unnamed product');
        skippedSelections.push(selection);
        return;
      }

      validItems.push({
        id: `${selection.id}-${selection.priceType}-${Date.now()}`,
        product: selection.product,
        quantity: selection.quantity,
        priceType: selection.priceType
      });
    });

    if (validItems.length) {
      setCartItems(prev => [...prev, ...validItems]);
    }

    if (skipped.length) console.warn(`Skipped ${skipped.length} item(s) without valid price`);

    setSelectedProducts(skippedSelections);
  };

  const handleUpdateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear all items from the cart?')) {
      setCartItems([]);
    }
  };

  const handleOrderSuccess = (orderData) => {
    setSuccessMessage(`Order #${orderData.id || 'N/A'} created successfully!`);
    setCartItems([]);
    setSelectedProducts([]);
    setShowCheckout(false);
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => {
      const { unitPrice, blocked } = selectUnitPrice(item.product, item.quantity, pricingSettings, item.priceType);
      if (blocked) return sum;
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingCart size={32} />
              Manual Order Entry
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Search and add products to create a manual order</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Selected Products List */}
          {selectedProducts.length > 0 && (
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-4">
                Selected Products ({selectedProducts.length})
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {selectedProducts.map((selection) => (
                  <div key={selection.id} className="border rounded-lg p-3 relative">
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveSelection(selection.id)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>

                    {/* Product Info */}
                    <img
                      src={
                        selection.product.image
                          ? (selection.product.image.startsWith('http')
                              ? selection.product.image
                              : selection.product.image.startsWith('/media/')
                                ? selection.product.image
                                : `/media/${selection.product.image.replace(/^media\/?/, '')}`)
                          : '/placeholder-product.png'
                      }
                      alt={selection.product.name}
                      className="w-full h-28 object-cover rounded mb-2"
                      onError={(e) => e.target.src = '/placeholder-product.png'}
                    />
                    <h3 className="font-medium text-gray-800 mb-2 text-sm pr-6">{selection.product.name}</h3>
                    
                    {/* Stock Info */}
                    <p className="text-xs text-gray-500 mb-2">
                      Stock: {selection.product.stock || 0} units
                    </p>

                    {/* Quantity Control */}
                    <div className="mb-2">
                      <label className="block text-xs font-normal text-gray-700 mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateSelection(selection.id, 'quantity', Math.max(1, selection.quantity - 1))}
                          className="bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={selection.quantity}
                          onChange={(e) => handleUpdateSelection(selection.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center border rounded px-1 py-0.5 text-sm"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdateSelection(selection.id, 'quantity', selection.quantity + 1)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Type Selection */}
                    <div className="mb-2">
                      <label className="block text-xs font-normal text-gray-700 mb-1">
                        Price Type
                      </label>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="retail"
                            checked={selection.priceType === 'retail'}
                            onChange={(e) => handleUpdateSelection(selection.id, 'priceType', e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-xs font-normal">
                            Retail: {fmt(selection.product.retail_price || selection.product.price)}
                          </span>
                        </label>
                        {selection.product.wholesale_price && (
                          <label className="flex items-center">
                            {(() => {
                              const threshold = pricingSettings?.wholesaleThreshold || defaultPricingSettings.wholesaleThreshold;
                              const wholesaleAccess = isWholesaleEligible(threshold, pricingSettings);
                              const meetsThreshold = selection.quantity >= threshold;
                              return (
                                <>
                            <input
                              type="radio"
                              value="wholesale"
                              checked={selection.priceType === 'wholesale'}
                                onChange={() => handleUpdateSelection(selection.id, 'priceType', 'wholesale')}
                                className="mr-2"
                                disabled={!wholesaleAccess}
                            />
                            <span className="text-xs font-normal">
                              Wholesale: {fmt(selection.product.wholesale_price)}
                              {!wholesaleAccess && ' (wholesale disabled in settings)'}
                              {wholesaleAccess && !meetsThreshold && ` (requires qty ≥ ${threshold})`}
                            </span>
                                </>
                              );
                            })()}
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Add Individual to Cart */}
                    <button
                      onClick={() => handleAddToCart(selection)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-medium"
                    >
                      <Plus size={16} />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>

              {/* Add All to Cart Button - Centered */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleAddAllToCart}
                  className="bg-secondary hover:brightness-90 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={20} />
                  Add All {selectedProducts.length} Products to Cart
                </button>
              </div>
            </div>
          )}

          {/* Search and Cart Summary Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search - Left/Full Width */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Search Products</h2>
                <ProductSearch
                  onProductSelect={handleProductSelect}
                  onProductsLoaded={handleProductsLoaded}
                  placeholder="Type product name to search..."
                />
              </div>

              {/* Payment Information Section */}
              <div ref={paymentSectionRef} className="bg-white p-4 md:p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

                {/* Optional customer details (cash-only; other methods have dedicated inputs) */}
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (optional)</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-in customer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0700 000 000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                      <input
                        type="text"
                        value={customerLocation}
                        onChange={(e) => setCustomerLocation(e.target.value)}
                        placeholder="City / area"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        onClick={() => setPaymentMethod('debt')}
                        className={`py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                          paymentMethod === 'debt'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        📋 Debt
                      </button>
                      <button
                        onClick={() => setPaymentMethod('mobilemoney')}
                        className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                          paymentMethod === 'mobilemoney'
                            ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50'
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center justify-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm">
                            <img 
                              src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png?w=360" 
                              alt="MTN MoMo" 
                              className="h-5 w-auto object-contain"
                            />
                            <div className="w-px h-5 bg-gray-300"></div>
                            <img 
                              src="https://images.seeklogo.com/logo-png/55/2/airtel-money-uganda-logo-png_seeklogo-556391.png" 
                              alt="Airtel Money" 
                              className="h-5 w-auto object-contain"
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">Mobile Money</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Money Number Input */}
                  {paymentMethod === 'mobilemoney' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Client's Mobile Money Number
                      </label>
                      <input
                        type="tel"
                        value={mobileMoneyNumber}
                        onChange={(e) => setMobileMoneyNumber(e.target.value)}
                        placeholder="e.g., 0700123456"
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-blue-600 mt-2">
                        Enter the client's mobile money number for payment confirmation
                      </p>
                    </div>
                  )}

                  {/* Debt Information Form */}
                  {paymentMethod === 'debt' && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-4">
                      <h3 className="text-sm font-semibold text-orange-900 mb-3">Customer Debt Information</h3>
                      
                      {/* Customer Name */}
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          Customer Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={debtCustomerName}
                          onChange={(e) => setDebtCustomerName(e.target.value)}
                          placeholder="Enter customer full name"
                          className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="tel"
                          value={debtCustomerPhone}
                          onChange={(e) => setDebtCustomerPhone(e.target.value)}
                          placeholder="e.g., 0700123456"
                          className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>

                      {/* Amount Paid Now */}
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          Amount Paid Now <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={debtAmountPaid}
                          onChange={(e) => setDebtAmountPaid(e.target.value)}
                          placeholder="Enter amount paid"
                          className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          min="0"
                          max={getTotalPrice()}
                        />
                        <p className="text-xs text-orange-600 mt-1">
                          Total: {fmt(getTotalPrice())}
                        </p>
                      </div>

                      {/* Remaining Amount Display */}
                      {debtAmountPaid && (
                        <div className="bg-white p-3 rounded-lg border border-orange-300">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Remaining Debt:</span>
                            <span className="text-lg font-bold text-red-600">
                              {fmt(Math.max(0, getTotalPrice() - parseFloat(debtAmountPaid || 0)))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Partial Payment Method Selection - Shows when amount >= 500 */}
                      {debtAmountPaid && parseFloat(debtAmountPaid) >= 500 && (
                        <div className="bg-white p-4 rounded-lg border border-orange-300 space-y-3">
                          <label className="block text-sm font-medium text-orange-900">
                            How is the customer paying? <span className="text-red-600">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                setDebtPartialPaymentMethod('cash');
                                setDebtPartialMobileNumber(''); // Clear mobile number if switching to cash
                              }}
                              className={`py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                                debtPartialPaymentMethod === 'cash'
                                  ? 'border-green-600 bg-green-50 text-green-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              💵 Cash
                            </button>
                            <button
                              onClick={() => setDebtPartialPaymentMethod('mobilemoney')}
                              className={`py-2 px-3 rounded-lg border-2 font-medium transition-all ${
                                debtPartialPaymentMethod === 'mobilemoney'
                                  ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50'
                                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center justify-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm">
                                  <img 
                                    src="https://momo.mtn.com/wp-content/uploads/sites/15/2022/07/Group-360.png?w=360" 
                                    alt="MTN MoMo" 
                                    className="h-5 w-auto object-contain"
                                  />
                                  <div className="w-px h-5 bg-gray-300"></div>
                                  <img 
                                    src="https://images.seeklogo.com/logo-png/55/2/airtel-money-uganda-logo-png_seeklogo-556391.png" 
                                    alt="Airtel Money" 
                                    className="h-5 w-auto object-contain"
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">Mobile Money</span>
                              </div>
                            </button>
                          </div>

                          {/* Mobile Money Number for Partial Payment */}
                          {debtPartialPaymentMethod === 'mobilemoney' && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-blue-900 mb-2">
                                Customer's Mobile Money Number <span className="text-red-600">*</span>
                              </label>
                              <input
                                type="tel"
                                value={debtPartialMobileNumber}
                                onChange={(e) => setDebtPartialMobileNumber(e.target.value)}
                                placeholder="e.g., 0700123456"
                                className="w-full px-4 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                          )}

                          {/* Payment Method Confirmation Display */}
                          {debtPartialPaymentMethod && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-gray-300">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 font-medium">Partial Payment via:</span>
                                <span className="font-bold text-gray-900 capitalize">
                                  {debtPartialPaymentMethod === 'mobilemoney' ? '📱 Mobile Money' : '💵 Cash'}
                                </span>
                              </div>
                              {debtPartialPaymentMethod === 'mobilemoney' && debtPartialMobileNumber && (
                                <div className="flex justify-between items-center text-xs mt-1">
                                  <span className="text-gray-600">Number:</span>
                                  <span className="font-semibold text-gray-800">{debtPartialMobileNumber}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Products on Debt Selection */}
                      <div>
                        <label className="block text-sm font-medium text-orange-900 mb-2">
                          Select Products on Debt
                        </label>
                        <div className="max-h-48 overflow-y-auto space-y-2 bg-white p-3 rounded-lg border border-orange-300">
                          {cartItems.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-4">No items in cart</p>
                          ) : (
                            cartItems.map((item) => {
                              const price = item.priceType === 'wholesale' 
                                ? item.product.wholesale_price 
                                : (item.product.retail_price || item.product.price);
                              const isSelected = debtProductIds.includes(item.id);
                              
                              return (
                                <label
                                  key={item.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                    isSelected ? 'bg-orange-100 border border-orange-400' : 'hover:bg-gray-50 border border-gray-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setDebtProductIds([...debtProductIds, item.id]);
                                      } else {
                                        setDebtProductIds(debtProductIds.filter(id => id !== item.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                  />
                                  <img
                                    src={
                                      item.product.image
                                        ? (item.product.image.startsWith('http')
                                            ? item.product.image
                                            : item.product.image.startsWith('/media/')
                                              ? item.product.image
                                              : `/media/${item.product.image.replace(/^media\/?/, '')}`)
                                        : '/placeholder-product.png'
                                    }
                                    alt={item.product.name}
                                    className="w-10 h-10 object-cover rounded"
                                    onError={(e) => e.target.src = '/placeholder-product.png'}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{item.product.name}</p>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × {fmt(price)}</p>
                                  </div>
                                  <p className="text-xs font-bold text-gray-700">
                                    {fmt(price * item.quantity)}
                                  </p>
                                </label>
                              );
                            })
                          )}
                        </div>
                        <p className="text-xs text-orange-600 mt-2">
                          Select products that will be recorded as debt if customer doesn't have enough money
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Summary */}
                  {cartItems.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-medium">Total Amount:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {fmt(getTotalPrice())}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-semibold text-gray-800 capitalize">
                          {paymentMethod === 'mobilemoney' ? 'Mobile Money' : paymentMethod}
                        </span>
                      </div>
                      {paymentMethod === 'mobilemoney' && mobileMoneyNumber && (
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600">Client Number:</span>
                          <span className="font-semibold text-gray-800">{mobileMoneyNumber}</span>
                        </div>
                      )}
                      {paymentMethod === 'debt' && debtCustomerName && (
                        <>
                          <div className="flex justify-between items-center text-sm mt-1">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-semibold text-gray-800">{debtCustomerName}</span>
                          </div>
                          {debtAmountPaid && (
                            <>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-600">Amount Paid:</span>
                                <span className="font-semibold text-green-600">{fmt(parseFloat(debtAmountPaid))}</span>
                              </div>
                              {debtPartialPaymentMethod && (
                                <div className="flex justify-between items-center text-sm mt-1">
                                  <span className="text-gray-600">Paid via:</span>
                                  <span className="font-semibold text-blue-600 capitalize">
                                    {debtPartialPaymentMethod === 'mobilemoney' ? 'Mobile Money' : 'Cash'}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-600">Debt Amount:</span>
                                <span className="font-semibold text-red-600">
                                  {fmt(Math.max(0, getTotalPrice() - parseFloat(debtAmountPaid)))}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Summary - Right Side */}
            <div className="lg:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Cart Summary</h3>
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {cartItems.length}
                  </span>
                </div>

                {/* Cart Items - Limited View */}
                <div className="max-h-64 overflow-y-auto mb-4">
                  {cartItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">Cart is empty</p>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.slice(0, 2).map((item) => {
                        const price = item.priceType === 'wholesale' 
                          ? item.product.wholesale_price 
                          : (item.product.retail_price || item.product.price);
                        
                        return (
                          <div key={item.id} className="border rounded p-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  item.product.image
                                    ? (item.product.image.startsWith('http')
                                        ? item.product.image
                                        : item.product.image.startsWith('/media/')
                                          ? item.product.image
                                          : `/media/${item.product.image.replace(/^media\/?/, '')}`)
                                    : '/placeholder-product.png'
                                }
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => e.target.src = '/placeholder-product.png'}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.product.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{item.priceType}</p>
                                <p className="text-xs font-bold text-green-600">
                                  {fmt(price * item.quantity)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs font-medium"
                              >
                                -
                              </button>
                              <span className="text-xs font-medium min-w-[30px] text-center">
                                Qty: {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {cartItems.length > 2 && (
                        <button
                          onClick={() => setShowFullCartModal(true)}
                          className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
                        >
                          View {cartItems.length - 2} more items...
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Total */}
                {cartItems.length > 0 && (
                  <>
                    <div className="border-t pt-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-green-600">
                          {fmt(getTotalPrice())}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCheckoutAndPrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        Checkout & Print
                      </button>
                      <button
                        onClick={handleCheckoutAndExit}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        Checkout & Exit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {/* Empty State & Product Not Loaded Alert */}
          {selectedProducts.length === 0 && !productsLoaded && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg p-6 text-center mb-6">
              <ShoppingCart size={48} className="mx-auto mb-4 text-yellow-300" />
              <p className="text-lg font-bold">Product not yet loaded, pliz refresh and wait</p>
              <p className="text-sm mt-2">If this persists, check your connection or try again later.</p>
            </div>
          )}
          {selectedProducts.length === 0 && productsLoaded && (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No products selected yet</p>
              <p className="text-sm mt-2">Search and select products from above to get started</p>
            </div>
          )}
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <CheckoutModal
            cartItems={cartItems}
            onClose={() => setShowCheckout(false)}
            onSuccess={handleOrderSuccess}
          />
        )}

        {/* Full Cart Modal */}
        {showFullCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              ref={fullCartRef}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold">Full Cart ({cartItems.length} items)</h3>
                <button onClick={() => setShowFullCartModal(false)} className="hover:bg-blue-700 p-1 rounded">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const price = item.priceType === 'wholesale' 
                      ? item.product.wholesale_price 
                      : (item.product.retail_price || item.product.price);
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 border rounded-lg p-3">
                        <img
                          src={
                            item.product.image
                              ? (item.product.image.startsWith('http')
                                  ? item.product.image
                                  : item.product.image.startsWith('/media/')
                                    ? item.product.image
                                    : `/media/${item.product.image.replace(/^media\/?/, '')}`)
                              : '/placeholder-product.png'
                          }
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => e.target.src = '/placeholder-product.png'}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{item.product.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{item.priceType}</p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-lg">
                            {fmt(price * item.quantity)}
                          </p>
                          <button
                            className="text-red-600 hover:text-red-800 mt-2"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-xl">Total:</span>
                  <span className="font-bold text-xl text-green-600">
                    {fmt(getTotalPrice())}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={handleClearCart}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold"
                  >
                    Clear Cart
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setShowFullCartModal(false);
                        handleCheckoutAndPrint();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                    >
                      Checkout & Print
                    </button>
                    <button
                      onClick={() => {
                        setShowFullCartModal(false);
                        handleCheckoutAndExit();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold"
                    >
                      Checkout & Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && (
          <Receipt
            customerName={paymentMethod === 'debt' ? (debtCustomerName || customerName || 'Walk-in Customer') : (customerName || 'Walk-in Customer')}
            customerPhone={paymentMethod === 'debt' ? (debtCustomerPhone || mobileMoneyNumber || customerPhone) : (customerPhone || mobileMoneyNumber)}
            customerEmail={customerEmail}
            customerLocation={customerLocation}
            cartItems={cartItems}
            paymentMethod={paymentMethod}
            mobileMoneyNumber={mobileMoneyNumber}
            debtCustomerName={debtCustomerName}
            debtCustomerPhone={debtCustomerPhone}
            debtAmountPaid={debtAmountPaid}
            debtProductIds={debtProductIds}
            debtPartialPaymentMethod={debtPartialPaymentMethod}
            debtPartialMobileNumber={debtPartialMobileNumber}
            receiptNumber={receiptNumber}
            onClose={() => {
              setShowReceipt(false);
              // Clear cart and reset form after closing receipt
              setCartItems([]);
              setSelectedProducts([]);
              setPaymentMethod('cash');
              setMobileMoneyNumber('');
              setDebtCustomerName('');
              setDebtCustomerPhone('');
              setDebtAmountPaid('');
              setDebtProductIds([]);
              setDebtPartialPaymentMethod('');
              setDebtPartialMobileNumber('');
              setReceiptNumber('');
              setSuccessMessage('Order completed successfully!');
              setTimeout(() => setSuccessMessage(''), 5000);
            }}
          />
        )}

        {/* Invoice Modal - For Full Debt Orders */}
        {showInvoice && (
          <Invoice
            cartItems={cartItems}
            debtCustomerName={debtCustomerName}
            debtCustomerPhone={debtCustomerPhone}
            onClose={() => {
              setShowInvoice(false);
              // Clear cart and reset form after closing invoice
              setCartItems([]);
              setSelectedProducts([]);
              setPaymentMethod('cash');
              setMobileMoneyNumber('');
              setDebtCustomerName('');
              setDebtCustomerPhone('');
              setDebtAmountPaid('');
              setDebtProductIds([]);
              setDebtPartialPaymentMethod('');
              setDebtPartialMobileNumber('');
              setSuccessMessage('Invoice generated successfully!');
              setTimeout(() => setSuccessMessage(''), 5000);
            }}
          />
        )}
      </div>
    </div>
  );
}
