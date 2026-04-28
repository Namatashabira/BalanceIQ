import { useState, useEffect } from 'react';
import { ShoppingCart, User, ShoppingBag, Clock, CheckCircle, Search, Eye, MessageSquare, X } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api/core';

export default function AbandonedCarts() {
  const toast = useToast();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'user', 'admin_manual', 'recovered', 'not_recovered'
  const [selectedCart, setSelectedCart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCarts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/abandoned-carts/`;
      
      if (filter === 'user') {
        url += '?cart_source=user';
      } else if (filter === 'admin_manual') {
        url += '?cart_source=admin_manual';
      } else if (filter === 'recovered') {
        url += '?recovered=true';
      } else if (filter === 'not_recovered') {
        url += '?recovered=false';
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCarts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading abandoned carts:', err);
      setCarts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
    const interval = setInterval(loadCarts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const viewCartDetails = async (cartId) => {
    try {
      const response = await fetch(`${API_URL}/abandoned-carts/?id=${cartId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCart(data);
        setNotes(data.notes || '');
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error loading cart details:', err);
    }
  };

  const markAsRecovered = async () => {
    if (!selectedCart) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/abandoned-carts/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCart.id,
          recovered: true,
          notes: notes,
        }),
      });

      if (response.ok) {
        toast.success('Cart marked as recovered!');
        setShowDetails(false);
        loadCarts();
      }
    } catch (err) {
      console.error('Error updating cart:', err);
      toast.error('Failed to update cart');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedCart) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/abandoned-carts/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCart.id,
          notes: notes,
        }),
      });

      if (response.ok) {
        toast.success('Notes saved!');
        loadCarts();
      }
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const totalCarts = carts.length;
  const userCarts = carts.filter(c => c.cartSource === 'user').length;
  const adminCarts = carts.filter(c => c.cartSource === 'admin_manual').length;
  const recoveredCarts = carts.filter(c => c.recovered).length;
  const totalValue = carts.reduce((sum, cart) => sum + parseFloat(cart.totalAmount || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-orange-600" />
            Abandoned Carts
          </h2>
          <p className="text-gray-600">Track and recover abandoned shopping carts from users and manual entry</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Abandoned</p>
                <p className="text-2xl font-bold text-gray-900">{totalCarts}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-orange-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Carts</p>
                <p className="text-2xl font-bold text-gray-900">{userCarts}</p>
              </div>
              <User className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Manual</p>
                <p className="text-2xl font-bold text-gray-900">{adminCarts}</p>
              </div>
              <ShoppingBag className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recovered</p>
                <p className="text-2xl font-bold text-gray-900">{recoveredCarts}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">UGX {totalValue.toLocaleString()}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Carts ({totalCarts})
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'user'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              User Carts ({userCarts})
            </button>
            <button
              onClick={() => setFilter('admin_manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'admin_manual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admin Manual ({adminCarts})
            </button>
            <button
              onClick={() => setFilter('not_recovered')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'not_recovered'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Recovered
            </button>
            <button
              onClick={() => setFilter('recovered')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'recovered'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recovered ({recoveredCarts})
            </button>
            <button
              onClick={loadCarts}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-gray-800 text-white hover:bg-gray-900 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Carts List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading abandoned carts...</p>
            </div>
          ) : carts.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No abandoned carts found</p>
              <p className="text-gray-500 text-sm mt-2">Abandoned carts will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cart ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Abandoned</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{cart.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cart.cartSource === 'admin_manual'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cart.cartSource === 'admin_manual' ? (
                            <>
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {cart.customerName || cart.userName || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500">{cart.customerEmail || cart.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cart.itemCount} items
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        UGX {parseFloat(cart.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(cart.abandonedAt || cart.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cart.recovered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cart.recovered ? (
                            <>
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Recovered
                            </>
                          ) : (
                            'Abandoned'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewCartDetails(cart.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cart Details Modal */}
        {showDetails && selectedCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-7 h-7 text-orange-600" />
                  Cart Details #{selectedCart.id}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedCart.customerName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedCart.customerEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{selectedCart.customerPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Username:</span>
                      <span className="ml-2 font-medium">{selectedCart.userName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cart Items ({selectedCart.itemCount})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Price Type</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Quantity</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCart.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                item.priceType === 'wholesale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {item.priceType}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">x{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">
                              {parseFloat(item.unitPrice).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                              {parseFloat(item.totalPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-right text-gray-900">Total:</td>
                          <td className="px-4 py-2 text-right text-gray-900">
                            UGX {parseFloat(selectedCart.totalAmount).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this abandoned cart..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedCart.recovered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCart.recovered ? 'Recovered' : 'Abandoned'}
                    </span>
                  </div>
                  {selectedCart.recovered && selectedCart.recoveredAt && (
                    <div className="text-sm text-gray-600">
                      Recovered on: {new Date(selectedCart.recoveredAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
                {!selectedCart.recovered && (
                  <button
                    onClick={markAsRecovered}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {saving ? 'Updating...' : 'Mark as Recovered'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
