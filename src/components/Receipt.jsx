import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

const API_URL = 'http://127.0.0.1:8000/api/core';

export default function Receipt({ 
  orderData,
  cartItems,
  paymentMethod,
  mobileMoneyNumber,
  customerName,
  customerPhone,
  customerEmail,
  customerLocation,
  debtCustomerName,
  debtCustomerPhone,
  debtAmountPaid,
  debtProductIds,
  debtPartialPaymentMethod,
  debtPartialMobileNumber,
  receiptNumber,
  onClose 
}) {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const { pricingSettings, theme } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  // Load business info from API
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/business-settings/`);
        setBusinessInfo(response.data);
      } catch (error) {
        console.error('Error fetching business settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  // Prefer locally stored business logo, then theme logo
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('businessLogoUrl') : null;
    if (stored) {
      setLogoUrl(stored);
    } else if (theme?.logo_url || theme?.logo) {
      setLogoUrl(theme.logo_url || theme.logo);
    }
  }, [theme?.logo_url, theme?.logo]);

  const currentDate = new Date().toLocaleDateString();
  // Use receiptNumber from props if provided, otherwise generate one
  const displayReceiptNumber = receiptNumber || `REC${Date.now().toString().slice(-6)}`;

  // Debug logging
  console.log('Receipt - cartItems:', cartItems);
  console.log('Receipt - paymentMethod:', paymentMethod);
  console.log('Receipt - debtProductIds:', debtProductIds);

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.priceType === 'wholesale' 
        ? item.product.wholesale_price 
        : (item.product.retail_price || item.product.price);
      return sum + (price * item.quantity);
    }, 0);
  };

  const computedSubTotal = getTotalPrice();
  const subTotal = orderData?.subTotal ?? computedSubTotal;

  const taxRate = pricingSettings?.taxRate ? Number(pricingSettings.taxRate) / 100 : 0;
  const taxAmount = orderData?.taxAmount ?? (subTotal * taxRate);
  const total = orderData?.totalAmount ?? (subTotal + taxAmount);

  const amountPaid = orderData?.amountPaid ?? (
    paymentMethod === 'debt' && debtAmountPaid 
      ? parseFloat(debtAmountPaid) 
      : total
  );
  const debtAmount = orderData?.debtAmount ?? (total - amountPaid);

  // Separate products paid vs products on debt
  // For cash/mobile money: all items are "paid"
  // For debt: separate based on debtProductIds if any are selected
  const productsPaid = paymentMethod === 'debt' && debtProductIds && debtProductIds.length > 0
    ? cartItems.filter(item => !debtProductIds.includes(item.id))
    : (paymentMethod === 'debt' ? [] : cartItems);
  
  const productsOnDebt = paymentMethod === 'debt' && debtProductIds && debtProductIds.length > 0
    ? cartItems.filter(item => debtProductIds.includes(item.id))
    : (paymentMethod === 'debt' ? cartItems : []);

  // Debug logging
  console.log('Receipt - productsPaid:', productsPaid);
  console.log('Receipt - productsOnDebt:', productsOnDebt);

  // Calculate subtotal and tax
  const taxPercentLabel = subTotal ? ((orderData?.taxAmount ?? taxAmount) / subTotal) * 100 : null;
  const taxLabel = taxPercentLabel
    ? `TAX (${taxPercentLabel.toFixed(1)}%)`
    : (pricingSettings?.taxRate ? `TAX (${pricingSettings.taxRate}%)` : 'TAX');

  const resolvedCustomerName = orderData?.customerName
    ?? (paymentMethod === 'debt'
      ? (debtCustomerName || customerName || 'Walk-in Customer')
      : (customerName || 'Walk-in Customer'));

  const resolvedCustomerPhone = orderData?.customerPhone
    ?? (paymentMethod === 'debt'
      ? (debtCustomerPhone || customerPhone || mobileMoneyNumber || '')
      : (customerPhone || mobileMoneyNumber || ''));

  const resolvedCustomerEmail = orderData?.customerEmail ?? customerEmail ?? '';
  const resolvedCustomerLocation = orderData?.customerLocation ?? customerLocation ?? '';

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full my-8">
        {/* Print-only styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .receipt-print-area, .receipt-print-area * {
              visibility: visible;
            }
            .receipt-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Receipt Content - Printable */}
        <div className="receipt-print-area bg-white">
          {/* Header with Navy Blue and Gold Design */}
          <div className="relative bg-gradient-to-r from-blue-900 to-blue-800 text-white p-2 overflow-hidden">
            <div className="relative z-10 flex justify-between items-start gap-2">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Business logo"
                    className="w-10 h-10 rounded bg-white object-contain border border-blue-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                    <span className="text-base font-bold text-blue-900">
                      {businessInfo?.businessName?.charAt(0) || 'B'}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-base font-bold">
                    {businessInfo?.businessName || 'Business Name'}
                  </h1>
                  <p className="text-blue-100 text-xs">{businessInfo?.businessType || ''}</p>
                  <p className="text-blue-100 text-xs">{businessInfo?.location}</p>
                  <p className="text-blue-100 text-xs">{businessInfo?.phone}</p>
                </div>
              </div>
              
              <div className="text-right">
                <h2 className="text-lg font-bold">RECEIPT</h2>
                <div className="bg-white bg-opacity-20 px-1 py-0.5 rounded">
                  <p className="text-xs font-bold">#{displayReceiptNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Payment Details */}
          <div className="p-8 grid grid-cols-2 gap-8 bg-gray-50">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">SOLD TO:</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-bold text-sm text-gray-800">{resolvedCustomerName}</p>
                {resolvedCustomerPhone && (
                  <p className="text-gray-600 text-xs">{resolvedCustomerPhone}</p>
                )}
                {resolvedCustomerEmail && <p className="text-gray-600 text-xs">{resolvedCustomerEmail}</p>}
                {resolvedCustomerLocation && <p className="text-gray-600 text-xs">{resolvedCustomerLocation}</p>}
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white p-1 rounded shadow-sm space-y-0.5">
                <div>
                  <span className="text-xs text-gray-600">Date:</span>
                  <p className="font-semibold text-xs text-gray-800">{currentDate}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Method:</span>
                  <p className="font-semibold text-xs text-gray-800 capitalize">
                    {paymentMethod === 'mobilemoney' ? 'Mobile Money' : paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          {cartItems.length === 0 ? (
            <div className="px-8 py-8">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
                <p className="text-red-700 font-semibold text-lg">No products in cart!</p>
                <p className="text-red-600 text-sm mt-2">Please add products before generating a receipt.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Products Paid Table */}
              {productsPaid.length > 0 && (
                <div className="px-2 py-1">
                  <h3 className="font-bold text-xs text-gray-800 mb-1">Products Paid:</h3>
                  <table className="w-full text-xs border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="text-left py-1 px-1 font-semibold border border-gray-400">ITEM</th>
                        <th className="text-center py-1 px-1 font-semibold border border-gray-400">QTY</th>
                        <th className="text-right py-1 px-1 font-semibold border border-gray-400">PRICE</th>
                        <th className="text-right py-1 px-1 font-semibold border border-gray-400">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsPaid.map((item, index) => {
                        // Null safety check
                        if (!item.product) {
                          console.error('Product data missing for item:', item);
                          return null;
                        }
                        const price = item.priceType === 'wholesale' 
                          ? (item.product.wholesale_price || 0)
                          : (item.product.retail_price || item.product.price || 0);
                        const itemTotal = price * item.quantity;

                        return (
                          <tr 
                            key={index} 
                            className={index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                          >
                          <td className="py-0.5 px-1 text-gray-800 border border-gray-300">
                            {item.product.name || 'Unknown Product'}
                            <span className="text-xs text-gray-500 ml-0.5">({item.priceType})</span>
                          </td>
                          <td className="py-0.5 px-1 text-center text-gray-800 border border-gray-300">{item.quantity}</td>
                          <td className="py-0.5 px-1 text-right text-gray-800 border border-gray-300">
                            {price.toLocaleString()}
                          </td>
                          <td className="py-0.5 px-1 text-right font-semibold text-gray-800 border border-gray-300">
                              {itemTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Products on Debt Table */}
              {productsOnDebt.length > 0 && (
                <div className="px-4 py-2">
              <h3 className="font-bold text-sm text-red-700 mb-2">Products on Debt:</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-red-600 text-white">
                    <th className="text-left py-2 px-2 font-semibold">DESCRIPTION</th>
                    <th className="text-center py-2 px-2 font-semibold">QTY</th>
                    <th className="text-right py-2 px-2 font-semibold">PRICE</th>
                    <th className="text-right py-2 px-2 font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {productsOnDebt.map((item, index) => {
                    // Null safety check
                    if (!item.product) {
                      console.error('Product data missing for debt item:', item);
                      return null;
                    }
                    const basePrice = item.priceType === 'wholesale'
                      ? (item.product.wholesale_price || 0)
                      : (item.product.retail_price || item.product.price || 0);
                    const price = Number(basePrice) || 0;
                    const itemTotal = price * (Number(item.quantity) || 0);

                    return (
                      <tr 
                        key={index} 
                        className={index % 2 === 0 ? 'bg-red-50' : 'bg-white'}
                      >
                        <td className="py-1 px-2 text-gray-800">
                          {item.product.name || 'Unknown Product'}
                          <span className="text-xs text-gray-500 ml-1">({item.priceType})</span>
                        </td>
                        <td className="py-1 px-2 text-center text-gray-800">{item.quantity}</td>
                        <td className="py-1 px-2 text-right text-gray-800">
                          {fmt(price)}
                        </td>
                        <td className="py-1 px-2 text-right font-semibold text-gray-800">
                          {fmt(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}

          {/* Totals Section */}
          <div className="px-2 py-1">
            <div className="flex justify-end">
              <div className="w-full space-y-0.5 text-xs">
                <div className="flex justify-between py-0.5 border-b border-gray-200">
                  <span className="text-gray-600">SUB TOTAL</span>
                  <span className="font-semibold">{fmt(subTotal)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-gray-200">
                  <span className="text-gray-600">{taxLabel}</span>
                  <span className="font-semibold">{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between py-1 bg-blue-900 text-white px-2 rounded">
                  <span className="font-bold">TOTAL</span>
                  <span className="font-bold">{fmt(total)}</span>
                </div>
                <div className="flex justify-between py-0.5 bg-green-50 px-2 rounded border border-green-500">
                  <span className="font-bold text-green-700">PAID</span>
                  <span className="font-bold text-green-700">{fmt(amountPaid)}</span>
                </div>
                {debtAmount > 0 && (
                  <div className="bg-red-50 border border-red-300 p-1 rounded">
                    <div className="flex justify-between">
                      <span className="font-bold text-red-700">BALANCE</span>
                      <span className="font-bold text-red-700">{fmt(debtAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Info and Remarks */}
          {(paymentMethod === 'mobilemoney' || paymentMethod === 'debt') && (
            <div className="px-2 pb-1">
              <div className="bg-blue-50 border-l-2 border-blue-400 p-1">
                <h4 className="font-bold text-xs text-gray-800">Payment:</h4>
                <div className="text-xs text-gray-700">
                  {paymentMethod === 'mobilemoney' && mobileMoneyNumber && (
                    <p>Mobile Money Number: {mobileMoneyNumber}</p>
                  )}
                  {paymentMethod === 'debt' && debtPartialPaymentMethod && (
                    <>
                      <p>Partial Payment Method: {debtPartialPaymentMethod === 'mobilemoney' ? 'Mobile Money' : 'Cash'}</p>
                      {debtPartialMobileNumber && <p>Mobile Number: {debtPartialMobileNumber}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bank/Tax Details */}
          {businessInfo?.taxId && (
            <div className="px-2 pb-1">
              <div className="border-t border-gray-200 pt-1 text-xs text-gray-600 text-center">
                {businessInfo.taxId && `TIN: ${businessInfo.taxId}`}
                {businessInfo.registrationNumber && ` | ${businessInfo.registrationNumber}`}
              </div>
            </div>
          )}

          {/* Thank You Message */}
          <div className="px-2 pb-2">
            <div className="text-center border-t border-gray-200 pt-1">
              <p className="text-sm font-bold text-blue-900">THANK YOU!</p>
              <p className="text-xs text-gray-600">{businessInfo?.email}</p>
            </div>
          </div>

          {/* Decorative Footer Wave */}
          <div className="h-8 bg-gradient-to-r from-blue-900 to-blue-800"></div>
        </div>

        {/* Action Buttons */}
        <div className="no-print p-3 bg-gray-50 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
