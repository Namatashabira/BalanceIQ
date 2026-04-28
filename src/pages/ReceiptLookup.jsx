import React, { useState, useEffect } from 'react';
import { Search, FileText, X } from 'lucide-react';
import Receipt from '../components/Receipt';

const API_URL = 'http://127.0.0.1:8000/api/core';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReceiptLookup() {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [allReceipts, setAllReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);

  const upsertReceiptInLists = (receiptSummary) => {
    if (!receiptSummary || !receiptSummary.receiptNumber) return;
    setAllReceipts((prev) => {
      const exists = prev.some(r => r.receiptNumber === receiptSummary.receiptNumber);
      return exists ? prev : [receiptSummary, ...prev].slice(0, 200);
    });
    setFilteredReceipts((prev) => {
      const exists = prev.some(r => r.receiptNumber === receiptSummary.receiptNumber);
      return exists ? prev : [receiptSummary, ...prev].slice(0, 200);
    });
  };

  useEffect(() => {
    fetchRecentReceipts();
  }, []);

  const fetchRecentReceipts = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(`${API_URL}/receipts/`, { headers: authHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAllReceipts(data);
        setFilteredReceipts(data);
      }
    } catch (err) {
      console.error('Error fetching receipts list:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const filterReceipts = (term, list) => {
    if (!term) return list;
    const t = term.toLowerCase();
    return list.filter(r => r.receiptNumber.toLowerCase().includes(t));
  };

  const handleSearch = async (overrideNumber) => {
    const targetNumber = overrideNumber || receiptNumber;
    if (!targetNumber.trim()) {
      setError('Please enter a receipt number');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await fetch(`${API_URL}/receipts/?receipt_number=${targetNumber}`, { headers: authHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setReceiptData(data);
        setShowReceipt(true);
        setStatusMessage('Receipt found and loaded.');
        setReceiptNumber(targetNumber);

        // Ensure the fetched receipt appears in the sidebar suggestions
        upsertReceiptInLists({
          receiptNumber: data.receiptNumber,
          totalAmount: data.totalAmount,
          amountPaid: data.amountPaid,
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt,
        });
      } else if (response.status === 404) {
        setError('Receipt not found');
        setReceiptData(null);
        setShowReceipt(false);
      } else {
        const message = await response.text();
        setError(`Failed to fetch receipt (${response.status}). ${message || ''}`.trim());
        setReceiptData(null);
        setShowReceipt(false);
      }
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError('Failed to fetch receipt. Please try again.');
      setReceiptData(null);
      setShowReceipt(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Convert receipt data to format expected by Receipt component
  const convertToCartItems = (items) => {
    return items.map((item, index) => ({
      id: `${index}`,
      product: {
        name: item.productName,
        retail_price: item.unitPrice,
        wholesale_price: item.unitPrice,
        price: item.unitPrice
      },
      quantity: item.quantity,
      priceType: item.priceType
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-gold-600" />
            Receipt Lookup
          </h1>
          <p className="text-gray-600 mt-2">Search and view receipts by receipt number</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setReceiptNumber(val);
                  setFilteredReceipts(filterReceipts(val, allReceipts));
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter receipt number (e.g., REC-20251221-A3F9K)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-navy-600 text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                <Search className="w-5 h-5" />
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {isLoadingList && (
            <div className="mt-4 text-sm text-gray-500">Loading recent receipts…</div>
          )}
          {!isLoadingList && filteredReceipts.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Recent receipts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredReceipts.slice(0, 12).map((r) => (
                  <button
                    key={r.receiptNumber}
                    onClick={() => handleSearch(r.receiptNumber)}
                    className="text-left bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition flex flex-col gap-1"
                  >
                    <div className="text-xs text-gray-500">#{r.receiptNumber}</div>
                    <div className="text-sm font-semibold text-gray-900">UGX {Number(r.totalAmount || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-600 capitalize">{r.paymentMethod}</div>
                    <div className="text-[11px] text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isLoadingList && receiptNumber && filteredReceipts.length === 0 && (
            <div className="mt-4 text-sm text-gray-500">No matching receipts.</div>
          )}
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {statusMessage}
          </div>
        )}

        {/* Receipt Summary */}
        {receiptData && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Receipt Number</p>
                <p className="text-xl font-semibold text-gray-900">{receiptData.receiptNumber}</p>
                <p className="text-sm text-gray-500 mt-1">{receiptData.createdAt ? new Date(receiptData.createdAt).toLocaleString() : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="text-lg font-semibold capitalize text-gray-900">{receiptData.paymentMethod}</p>
                {receiptData.mobileMoneyNumber ? (
                  <p className="text-sm text-gray-600">MoMo: {receiptData.mobileMoneyNumber}</p>
                ) : null}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-semibold text-gray-900">{receiptData.customerName || 'Walk-in'}</p>
                {receiptData.customerPhone ? (
                  <p className="text-xs text-gray-600">{receiptData.customerPhone}</p>
                ) : null}
                {receiptData.customerEmail ? (
                  <p className="text-xs text-gray-600">{receiptData.customerEmail}</p>
                ) : null}
                {receiptData.customerLocation ? (
                  <p className="text-xs text-gray-600">{receiptData.customerLocation}</p>
                ) : null}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Amount Paid</p>
                <p className="text-lg font-semibold text-emerald-700">UGX {Number(receiptData.amountPaid || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total: UGX {Number(receiptData.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Debt</p>
                <p className="text-lg font-semibold text-amber-700">UGX {Number(receiptData.debtAmount || 0).toLocaleString()}</p>
                {receiptData.debtPartialPaymentMethod ? (
                  <p className="text-xs text-gray-600">Partial via {receiptData.debtPartialPaymentMethod}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-center px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Total</th>
                    <th className="text-center px-3 py-2">Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items?.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 text-gray-900">{item.productName}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-700">UGX {Number(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-semibold">UGX {Number(item.totalPrice || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center">
                        {item.isDebt ? (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">Debt</span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => setShowReceipt(true)}
                className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition"
              >
                View Printable Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setReceiptData(null);
                  setReceiptNumber('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Receipt Display */}
        {showReceipt && receiptData && (
          <Receipt
            orderData={receiptData}
            cartItems={convertToCartItems(receiptData.items)}
            paymentMethod={receiptData.paymentMethod}
            mobileMoneyNumber={receiptData.mobileMoneyNumber}
            customerName={receiptData.customerName}
            customerPhone={receiptData.customerPhone}
            customerEmail={receiptData.customerEmail}
            customerLocation={receiptData.customerLocation}
            debtCustomerName={receiptData.customerName}
            debtCustomerPhone={receiptData.customerPhone}
            debtAmountPaid={receiptData.amountPaid}
            debtProductIds={receiptData.items.filter(i => i.isDebt).map((_, idx) => `${idx}`)}
            debtPartialPaymentMethod={receiptData.debtPartialPaymentMethod}
            debtPartialMobileNumber={receiptData.debtPartialMobileNumber}
            receiptNumber={receiptData.receiptNumber}
            onClose={() => {
              setShowReceipt(false);
              setReceiptData(null);
              setReceiptNumber('');
              setStatusMessage('');
            }}
          />
        )}

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-3">How to Use</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-gold-600 font-bold">1.</span>
              <span>Enter the receipt number in the format: REC-YYYYMMDD-XXXXX</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-600 font-bold">2.</span>
              <span>Click the "Search" button or press Enter</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-600 font-bold">3.</span>
              <span>View and print the receipt details if found</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
