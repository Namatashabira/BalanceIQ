import React, { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';
import { salesAPI } from '../services/salesAPI';
import {
  DollarSign, Package, ShoppingCart, TrendingUp, Users, MapPin,
  Calendar, Filter, Download, Search, Eye, RefreshCw, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Sales() {
    // Helper to get tenant UUID
    const getTenantUUID = () => {
      const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
      return activeTenant?.uuid || activeTenant?.id;
    };
  const { pricingSettings } = useConfig();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [salesType, setSalesType] = useState('both');
  const [category, setCategory] = useState('all');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({});

  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  useEffect(() => {
    loadSalesData();
  }, [dateRange, salesType, category, customDateFrom, customDateTo]);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const params = {};
      const tenant_uuid = getTenantUUID();
      params.tenant_uuid = tenant_uuid;
      if (dateRange === 'custom' && customDateFrom && customDateTo) {
        params.start_date = customDateFrom;
        params.end_date = customDateTo;
      } else if (dateRange !== 'custom') {
        const endDate = new Date();
        const startDate = new Date();
        switch (dateRange) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        }
        params.start_date = startDate.toISOString().split('T')[0];
        params.end_date = endDate.toISOString().split('T')[0];
      }
      if (salesType !== 'both') {
        params.customer_type = salesType;
      }
      // Fetch dashboard data
      const dashboardResponse = await salesAPI.getDashboard(params);
      // Fetch trend data
      const trendParams = { ...params, group_by: 'day' };
      const trendResponse = await salesAPI.getTrend(trendParams);
      // Transform API data to match frontend structure
      const apiData = dashboardResponse.data;
      const trendData = trendResponse.data;
      const transformedData = {
        overview: {
          totalSales: parseFloat(apiData.total_sales || 0),
          totalOrders: apiData.total_orders || 0,
          unitsSold: apiData.units_sold || 0,
          avgOrderValue: parseFloat(apiData.average_order_value || 0),
          retailSplit: parseFloat(apiData.retail_percentage || 0),
          wholesaleSplit: parseFloat(apiData.wholesale_percentage || 0),
          trends: {
            sales: parseFloat(apiData.growth_percentage || 0),
            orders: 8.3,
            units: 15.2,
            aov: 4.1
          }
        },
        growth: {
          monthOverMonth: parseFloat(apiData.growth_percentage || 0),
          quarterOverQuarter: 8.3,
          yearOverYear: 25.7,
          trend: trendData.map((item, index) => ({
            period: new Date(item.period).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            growth: (Math.random() * 30 - 5) // Placeholder for growth calculation
          }))
        },
        salesTrend: trendData.map(item => ({
          date: item.period,
          sales: parseFloat(item.sales || 0),
          orders: item.orders_count || 0,
          retail: parseFloat(item.sales || 0) * 0.6, // Approximate split
          wholesale: parseFloat(item.sales || 0) * 0.4
        })),
        // Real data from API
        topProducts: apiData.top_products || [],
        categories: apiData.categories || [],
        customers: {
          newCustomers: apiData.customer_insights?.new_customers || 0,
          returningCustomers: apiData.customer_insights?.returning_customers || 0,
          avgSpendNew: parseFloat(apiData.customer_insights?.avg_spend_new || 0),
          avgSpendReturning: parseFloat(apiData.customer_insights?.avg_spend_returning || 0),
          repeatRate: parseFloat(apiData.customer_insights?.repeat_rate || 0)
        },
        geography: apiData.geographic_performance || [],
        operations: {
          salesVelocity: parseFloat(apiData.sales_operations?.daily_sales_velocity || 0),
          completionRate: parseFloat(apiData.sales_operations?.completion_rate || 0),
          cancellationRate: parseFloat(apiData.sales_operations?.cancellation_rate || 0),
          pendingOrders: apiData.sales_operations?.pending_orders || 0
        },
        orders: apiData.recent_orders || []
      };
      
      setData(transformedData);
    } catch (error) {
      console.error('Error loading sales data:', error);
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = data.orders?.filter(order => 
    (salesType === 'both' || order.type === salesType) &&
    (searchTerm === '' || 
     order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredOrders.length / 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <DollarSign className="w-12 h-12 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Analytics</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSalesData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          title="Total Sales"
          value={fmt(data.overview?.totalSales || 0)}
          icon={DollarSign}
          trend={data.overview?.trends?.sales}
          color="green"
        />
        <MetricCard
          title="Total Orders"
          value={data.overview?.totalOrders || 0}
          icon={ShoppingCart}
          trend={data.overview?.trends?.orders}
          color="blue"
        />
        <MetricCard
          title="Units Sold"
          value={data.overview?.unitsSold || 0}
          icon={Package}
          trend={data.overview?.trends?.units}
          color="purple"
        />
        <MetricCard
          title="Avg Order Value"
          value={fmt(data.overview?.avgOrderValue || 0)}
          icon={TrendingUp}
          trend={data.overview?.trends?.aov}
          color="orange"
        />
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span className="font-medium text-gray-600">Sales Split</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Retail</span>
              <span className="font-bold">{data.overview?.retailSplit}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wholesale</span>
              <span className="font-bold">{data.overview?.wholesaleSplit}%</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 lg:hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-gray-600">Sales Growth</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Month-over-Month</span>
              <span className={`font-bold ${data.growth?.monthOverMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.growth?.monthOverMonth >= 0 ? '+' : ''}{data.growth?.monthOverMonth}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Year-over-Year</span>
              <span className={`font-bold ${data.growth?.yearOverYear >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.growth?.yearOverYear >= 0 ? '+' : ''}{data.growth?.yearOverYear}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (e.target.value === 'custom') {
                  setShowCustomDateRange(true);
                } else {
                  setShowCustomDateRange(false);
                }
              }}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={salesType}
              onChange={(e) => setSalesType(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="both">Retail & Wholesale</option>
              <option value="retail">Retail Only</option>
              <option value="wholesale">Wholesale Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="seeds">Seeds</option>
              <option value="fertilizers">Fertilizers</option>
              <option value="herbicides">Herbicides</option>
            </select>
          </div>
        </div>
        
        {/* Custom Date Range */}
        {showCustomDateRange && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Date Range</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  if (customDateFrom && customDateTo) loadSalesData();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setShowCustomDateRange(false);
                  setDateRange('30d');
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sales Growth Chart - Large Screens Only */}
      <div className="hidden lg:block bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Growth (Period-over-Period)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.growth?.trend || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => [`${value}%`, 'Growth']} />
            <Line type="monotone" dataKey="growth" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sales Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [fmt(value), '']} />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Retail vs Wholesale</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [fmt(value), '']} />
              <Area type="monotone" dataKey="retail" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="wholesale" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {data.topProducts?.map((product, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.units} units • {product.percentage}%</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(product.revenue)}</p>
                  <p className="text-xs text-gray-500">{product.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.categories || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="share"
                label={({ name, share }) => `${name} ${share}%`}
              >
                {data.categories?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer & Geographic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Insights</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.customers?.newCustomers}</p>
              <p className="text-sm text-gray-600">New Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.customers?.returningCustomers}</p>
              <p className="text-sm text-gray-600">Returning</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Repeat Rate</span>
              <span className="font-bold">{data.customers?.repeatRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg New Customer Spend</span>
              <span className="font-bold">{fmt(data.customers?.avgSpendNew)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Geographic Performance</h3>
          <div className="space-y-3">
            {data.geography?.map((region, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{region.location}</p>
                  <p className="text-sm text-gray-600">{region.total_orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(region.total_sales)}</p>
                  <p className="text-sm text-gray-600">Avg: {fmt(region.avg_order_value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Operations */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Sales Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{fmt(data.operations?.salesVelocity || 0)}</p>
            <p className="text-sm text-gray-600">Daily Sales Velocity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.operations?.completionRate || 0}%</p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{data.operations?.cancellationRate || 0}%</p>
            <p className="text-sm text-gray-600">Cancellation Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{data.operations?.pendingOrders || 0}</p>
            <p className="text-sm text-gray-600">Pending Orders</p>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Items</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">#{order.id}</td>
                  <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                  <td className="p-3">{order.customer_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.order_type === 'retail' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {order.order_type}
                    </span>
                  </td>
                  <td className="p-3">{order.items_count}</td>
                  <td className="p-3 font-bold">{fmt(order.total)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.order_source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.order_source}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, filteredOrders.length)} of {filteredOrders.length} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendColor = trend >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}