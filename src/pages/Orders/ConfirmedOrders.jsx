import { useState, useEffect } from "react";
import { fetchOrders } from "../../api";
import { Package, User, MapPin, Calendar, DollarSign, ShoppingBag } from 'lucide-react';

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'user', 'manual'

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders('confirmed');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'user') return order.order_source === 'user' || !order.order_source;
    if (filter === 'manual') return order.order_source === 'manual';
    return true;
  });

  const userOrders = orders.filter(o => o.order_source === 'user' || !o.order_source).length;
  const manualOrders = orders.filter(o => o.order_source === 'manual').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Package className="w-8 h-8 text-green-600" />
            Confirmed Orders
          </h2>
          <p className="text-gray-600">View all confirmed orders from users and manual entry</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <Package className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Orders</p>
                <p className="text-2xl font-bold text-gray-900">{userOrders}</p>
              </div>
              <User className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Manual Orders</p>
                <p className="text-2xl font-bold text-gray-900">{manualOrders}</p>
              </div>
              <ShoppingBag className="w-10 h-10 text-purple-500 opacity-20" />
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
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'user'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              User Orders ({userOrders})
            </button>
            <button
              onClick={() => setFilter('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'manual'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Manual Orders ({manualOrders})
            </button>
            <button
              onClick={loadOrders}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-gray-800 text-white hover:bg-gray-900 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No confirmed orders found</p>
              <p className="text-gray-500 text-sm mt-2">Orders will appear here once confirmed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.order_source === 'manual'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.order_source === 'manual' ? (
                            <>
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Manual
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
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.phone_number}
                        <div className="text-xs text-gray-500">{order.delivery ? "Delivery" : "Pickup"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {order.location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.order_type === "wholesale"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {order.order_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-sm font-semibold text-gray-900">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {order.total?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(order.date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

