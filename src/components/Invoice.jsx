import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';

const API_URL = 'http://127.0.0.1:8000/api/core';

export default function Invoice({ 
  cartItems,
  debtCustomerName,
  debtCustomerPhone,
  onClose 
}) {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const invoiceNumber = `INV${Date.now().toString().slice(-6)}`;
  const invoiceDate = new Date().toLocaleDateString();

  // Debug logging
  console.log('Invoice - cartItems:', cartItems);
  console.log('Invoice - debtCustomerName:', debtCustomerName);
  console.log('Invoice - debtCustomerPhone:', debtCustomerPhone);

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

  // Calculate totals
    const subTotal = cartItems.reduce((sum, item) => {
      const basePrice = item.priceType === 'wholesale'
        ? (item.product.wholesale_price || 0)
        : (item.product.retail_price || item.product.price || 0);
      const price = Number(basePrice) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  const taxRate = 0.10; // 10% tax
  const taxAmount = subTotal * taxRate;
  const total = subTotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .invoice-print, .invoice-print * {
              visibility: visible;
            }
            .invoice-print {
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

        {/* Invoice Content */}
        <div className="invoice-print bg-white">
          {/* Header with Navy Blue and Gold Design */}
          <div className="relative bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 opacity-20 rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full -ml-32 -mb-32"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-900">
                      {businessInfo?.businessName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-wide">
                    {businessInfo?.businessName || 'Business Name'}
                  </h1>
                </div>
                <p className="text-blue-100 text-sm">{businessInfo?.businessType || ''}</p>
                <p className="text-blue-100 text-sm">{businessInfo?.location}</p>
                <p className="text-blue-100 text-sm">{businessInfo?.phone}</p>
              </div>
              
              <div className="text-right">
                <h2 className="text-5xl font-bold mb-2">INVOICE</h2>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded">
                  <p className="text-sm text-blue-100">INVOICE</p>
                  <p className="text-xl font-bold">#{invoiceNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer and Invoice Details */}
          <div className="p-8 grid grid-cols-2 gap-8 bg-gray-50">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO:</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="font-bold text-lg text-gray-800">{debtCustomerName}</p>
                <p className="text-gray-600">{debtCustomerPhone}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Invoice Date:</span>
                  <p className="font-semibold text-gray-800">{invoiceDate}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <p className="font-semibold text-red-600">Payment Due on Delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-4">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="text-left py-3 px-4 font-semibold">DESCRIPTION</th>
                  <th className="text-center py-3 px-4 font-semibold">QTY</th>
                  <th className="text-right py-3 px-4 font-semibold">PRICE</th>
                  <th className="text-right py-3 px-4 font-semibold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => {
                  // Null safety check
                  if (!item.product) {
                    console.error('Product data missing for invoice item:', item);
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
                      <td className="py-3 px-4 text-gray-800">
                        {item.product.name || 'Unknown Product'}
                        <span className="text-xs text-gray-500 ml-2">({item.priceType})</span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-800">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-800">
                        {fmt(price)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-800">
                        {fmt(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="px-8 py-6">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">SUB TOTAL</span>
                  <span className="font-semibold">{fmt(subTotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">TAX (10%)</span>
                  <span className="font-semibold">{fmt(taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 bg-blue-900 text-white px-4 rounded">
                  <span className="font-bold text-lg">TOTAL</span>
                  <span className="font-bold text-xl">{fmt(total)}</span>
                </div>
                <div className="bg-red-50 border-2 border-red-300 p-3 rounded mt-4">
                  <p className="text-red-700 font-bold text-center">AMOUNT DUE: {fmt(total)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms and Footer */}
          <div className="px-8 pb-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <h4 className="font-bold text-gray-800 mb-2">Payment Terms:</h4>
              <p className="text-sm text-gray-700">
                This invoice represents items purchased on credit. Full payment is due upon delivery or as agreed. 
                Late payments may incur additional charges.
              </p>
            </div>

            {/* Bank Details */}
            {businessInfo?.taxId && (
              <div className="border-t-2 border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  {businessInfo.taxId && `TIN: ${businessInfo.taxId}`}
                  {businessInfo.registrationNumber && ` | Reg No: ${businessInfo.registrationNumber}`}
                </p>
              </div>
            )}

            {/* Thank You Message */}
            <div className="mt-6 text-center border-t-2 border-gray-200 pt-6">
              <p className="text-2xl font-bold text-blue-900 mb-2">THANK YOU FOR YOUR BUSINESS!</p>
              <p className="text-sm text-gray-600">{businessInfo?.email} | {businessInfo?.website}</p>
            </div>
          </div>

          {/* Decorative Footer Wave */}
          <div className="h-20 bg-gradient-to-r from-blue-900 to-blue-800 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-full">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,0 C150,50 350,0 600,50 C850,100 1050,50 1200,100 L1200,120 L0,120 Z" fill="#f59e0b" opacity="0.3"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print p-6 bg-gray-50 border-t flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
