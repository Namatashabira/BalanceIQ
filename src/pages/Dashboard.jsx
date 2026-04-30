import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, TrendingUp, ShoppingCart, Users, AlertTriangle, 
  XCircle, DollarSign, Activity, RefreshCw,
  Plus, Clock, CheckCircle,
  ArrowUp, ArrowDown, Bell, X, FileText, BarChart,
  Phone, Mail, MapPin
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import { useConfig } from '../context/ConfigContext';
import { getAll, bulkUpsert } from '../services/localStore';
import { formatCurrency, getCurrencyCode } from '../utils/pricingHelpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [accountingData, setAccountingData] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userRole, setUserRole] = useState('owner'); // owner, manager, staff
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);
  const notificationRef = useRef(null);
  const { pricingSettings } = useConfig();
  const currencyCode = getCurrencyCode(pricingSettings);
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  const [showAllContacts, setShowAllContacts] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);



  useEffect(() => {
    if (!dashboardData?.critical_alerts?.delayed_orders) return;
    dashboardData.critical_alerts.delayed_orders.forEach(order => {
      const existingNotif = notifications.find(n => n.orderData?.id === order.id && n.type === 'delayed_order');
      if (!existingNotif) {
        const notification = {
          id: Date.now() + Math.random(),
          type: 'delayed_order',
          title: 'Order Confirmation Delayed',
          message: `Order #${order.order_number} pending for ${order.hours_pending}h`,
          timestamp: new Date().toISOString(),
          read: false,
          orderData: order
        };
        addNotification(notification);
      }
    });
  }, [dashboardData, notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Call fetchDashboardData directly without dependency
      if (typeof fetchDashboardData === 'function') {
        fetchDashboardData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, userRole]);

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

  // Build WebSocket URL from env or API base so it works in dev/prod without edits
  const getAdminWsUrl = useCallback(() => {
    const envUrl = import.meta.env.VITE_ADMIN_WS_URL;
    if (envUrl) return envUrl;
    const wsBase = API_BASE.replace(/^http/, 'ws').replace('/api', '');
    return `${wsBase}/ws/admin/orders/`;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const isOnline = navigator.onLine;

      let data, accountingResponse, contactsData;

      if (isOnline) {
        const [dashboardResponse, accResponse, contactsResponse] = await Promise.all([
          fetchWithAuth(`${API_BASE}/products/dashboard/stats/?role=${userRole}`),
          fetchAccountingData(),
          fetchWithAuth(`${API_BASE}/core/customers/`)
        ]);

        if (!dashboardResponse || !dashboardResponse.ok) {
          throw new Error('Unable to load dashboard data. Please log in again.');
        }

        data = await dashboardResponse.json();
        accountingResponse = accResponse;
        contactsData = contactsResponse?.ok ? await contactsResponse.json() : [];

        // Cache for offline use
        await bulkUpsert('analytics', [{ id: 'dashboard', ...data }]);
        await bulkUpsert('customers', Array.isArray(contactsData) ? contactsData : []);
      } else {
        // Offline — load from local store
        const cached = await getAll('analytics');
        const dashEntry = cached.find(r => r.id === 'dashboard');
        data = dashEntry || null;
        accountingResponse = null;
        const cachedCustomers = await getAll('customers');
        contactsData = cachedCustomers;
      }

      if (!data) throw new Error('No dashboard data available offline.');

      setDashboardData(data);
      setAccountingData(accountingResponse);
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setLastUpdated(new Date().toLocaleString());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Last resort: try local cache
      try {
        const cached = await getAll('analytics');
        const dashEntry = cached.find(r => r.id === 'dashboard');
        if (dashEntry) {
          setDashboardData(dashEntry);
          setLoading(false);
          return;
        }
      } catch {}
      setError(error.message || 'Failed to load dashboard');
      setLoading(false);
    }
  }, [userRole]);

  const fetchAccountingData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [expenses, payments, taxes, profitLoss] = await Promise.all([
        fetch(`${API_BASE}/accounting/expenses/summary/`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/accounting/payments/summary/`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/accounting/taxes/summary/`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/accounting/profit-loss/?date_from=${startOfMonth}&date_to=${endOfMonth}`, { headers }).then(r => r.json()).catch(() => null)
      ]);

      return { expenses, payments, taxes, profitLoss };
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      return null;
    }
  };

  // All useEffect hooks must be at the top level - moved after function definitions
  useEffect(() => {
    // Initial data fetch
    if (typeof fetchDashboardData === 'function') {
      fetchDashboardData();
    }
    if (typeof connectWebSocket === 'function') {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // WebSocket connection for real-time notifications
  const connectWebSocket = useCallback(() => {
    try {
      // Avoid duplicate sockets in React Strict Mode double-mount
      if (wsRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(wsRef.current.readyState)) {
        return;
      }

      const wsUrl = getAdminWsUrl();
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket connected for admin notifications (${wsUrl})`);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        const isOrderCreated = data.type === 'order.created' || data.type === 'new_order';
        const isStatusUpdate = data.type === 'order.status.update' || data.type === 'status_update';

        if (isOrderCreated || isStatusUpdate) {
          const notification = {
            id: Date.now(),
            type: isOrderCreated ? 'new_order' : 'order_update',
            title: isOrderCreated ? 'New Order Received' : 'Order Status Updated',
            message: isOrderCreated 
              ? `Order #${data.order_number ?? data.order?.id} from ${data.customer_name ?? data.order?.customer_name ?? 'customer'}` 
              : `Order #${data.order_number ?? data.order?.id} is now ${data.status ?? data.order?.status}`,
            timestamp: new Date().toISOString(),
            read: false,
            orderData: data
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          // Refresh dashboard data if function exists
          if (typeof fetchDashboardData === 'function') {
            fetchDashboardData();
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error, 'url:', wsUrl);
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (code ${event.code}). Reconnecting in 5s...`);
        setTimeout(() => connectWebSocket(), 5000);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }, [getAdminWsUrl]);

  // Add notification
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notif = notifications.find(n => n.id === id);
    if (!notif?.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    if (typeof fetchDashboardData === 'function') {
      fetchDashboardData();
    }
  };

  if (loading || !dashboardData) {
    if (error) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    kpi_cards = {},
    critical_alerts = {},
    charts = {},
    recent_activity = {},
    summary = {},
  } = dashboardData || {};

  // Defensive fallbacks for nested payloads so the UI never crashes on missing fields
  const stockMetrics = {
    total_products: kpi_cards?.stock?.total_products ?? 0,
    total_stock: kpi_cards?.stock?.total_stock ?? summary?.total_stock ?? 0,
    active: kpi_cards?.stock?.active ?? 0,
    inactive: kpi_cards?.stock?.inactive ?? 0,
    low_stock: kpi_cards?.stock?.low_stock ?? 0,
    out_of_stock: kpi_cards?.stock?.out_of_stock ?? 0,
    current_stock: summary?.current_stock ?? 0,
    old_stock: summary?.old_stock ?? 0,
  };

  const stockValue = {
    total: summary?.stock_value?.total ?? 0,
    current: summary?.stock_value?.current ?? 0,
    expired: summary?.stock_value?.expired ?? 0,
  };

  const safeRecentActivity = {
    latest_orders: Array.isArray(recent_activity?.latest_orders) ? recent_activity.latest_orders : [],
    stock_updates: Array.isArray(recent_activity?.stock_updates) ? recent_activity.stock_updates : [],
  };
  
  const contactsToShow = showAllContacts
    ? contacts
    : Array.isArray(contacts)
      ? contacts.slice(0, isLargeScreen ? 8 : 4)
      : [];

  // Safe fallbacks to avoid crashes when backend omits optional fields
  const revenueCard = {
    total: typeof kpi_cards?.revenue?.total === 'number' ? kpi_cards.revenue.total : 0,
    last30: typeof kpi_cards?.revenue?.last_30_days === 'number' ? kpi_cards.revenue.last_30_days : 0,
    last7: typeof kpi_cards?.revenue?.last_7_days === 'number' ? kpi_cards.revenue.last_7_days : 0,
    growth30: typeof kpi_cards?.revenue?.growth_30d === 'number' ? kpi_cards.revenue.growth_30d : 0,
  };

  const ordersCard = {
    total: kpi_cards?.orders?.total ?? 0,
    completion_rate: kpi_cards?.orders?.completion_rate ?? 0,
    completed: kpi_cards?.orders?.completed ?? 0,
    pending: kpi_cards?.orders?.pending ?? 0,
  };

  const customersCard = {
    total_users: kpi_cards?.customers?.total_users ?? 0,
    unique_customers: kpi_cards?.customers?.unique_customers ?? 0,
    new_last_30_days: kpi_cards?.customers?.new_last_30_days ?? 0,
  };

  const stockCard = {
    total_products: kpi_cards?.stock?.total_products ?? 0,
    active: kpi_cards?.stock?.active ?? 0,
    inactive: kpi_cards?.stock?.inactive ?? 0,
    low_stock: kpi_cards?.stock?.low_stock ?? 0,
    out_of_stock: kpi_cards?.stock?.out_of_stock ?? 0,
  };

  // Prepare chart data
  const salesTrend = charts.sales_trend || [];
  const orderStatusBreakdown = charts.order_status_breakdown || [];

  const salesChartData = {
    labels: salesTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: `Revenue (${currencyCode})`,
        data: salesTrend.map(d => d.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const orderStatusChartData = {
    labels: orderStatusBreakdown.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
    datasets: [
      {
        data: orderStatusBreakdown.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // pending - blue
          'rgba(34, 197, 94, 0.8)',    // confirmed - green
          'rgba(168, 85, 247, 0.8)',   // paid - purple
          'rgba(16, 185, 129, 0.8)',   // delivered - teal
          'rgba(239, 68, 68, 0.8)',    // cancelled - red
          'rgba(249, 115, 22, 0.8)'    // failed - orange
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4 w-full">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive overview • Auto-syncing • Last updated: {lastUpdated}
          </p>
        </div>
        
        <div className="flex gap-3 items-center flex-wrap">
          {/* Role Selector */}
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="owner">Owner View</option>
            <option value="manager">Manager View</option>
            <option value="staff">Staff View</option>
          </select>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          {/* Spacer to push notification to far right */}
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
          
          {/* Notifications Icon - Far Right */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className={`w-6 h-6 text-gray-700 dark:text-gray-300 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications ({unreadCount} unread)
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            !notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`mt-1 p-2 rounded-full ${
                                notif.type === 'new_order' 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : notif.type === 'delayed_order'
                                  ? 'bg-red-100 dark:bg-red-900/30'
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                {notif.type === 'new_order' && <ShoppingCart className="w-4 h-4 text-green-600" />}
                                {notif.type === 'delayed_order' && <Clock className="w-4 h-4 text-red-600" />}
                                {notif.type === 'order_update' && <Activity className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {notif.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(notif.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          {!notif.read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Revenue Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
            </div>
            {revenueCard.growth30 >= 0 ? (
              <ArrowUp className="w-5 h-5 text-green-500" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {userRole === 'staff' && kpi_cards.revenue?.total === 'restricted' 
              ? 'Restricted' 
              : fmt(revenueCard.total)}
          </p>
          <div className="mt-4 flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Last 30d: <span className="font-semibold">{fmt(revenueCard.last30)}</span>
            </span>
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {revenueCard.growth30 >= 0 ? '+' : ''}{revenueCard.growth30}%
            </span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {ordersCard.completion_rate}% completed
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{ordersCard.total}</p>
          <div className="mt-4 flex justify-between text-xs">
            <span className="text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {ordersCard.completed} completed
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {ordersCard.pending} pending
            </span>
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
              +{customersCard.new_last_30_days} new
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Customers</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{customersCard.total_users}</p>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Unique buyers: <span className="font-semibold">{customersCard.unique_customers}</span>
          </div>
        </div>

        {/* Stock Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-300" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stockMetrics.total_stock} units
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Products</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stockMetrics.total_products}</p>
          <div className="mt-4 flex justify-between text-xs">
            <span className="text-green-600 dark:text-green-400">{stockCard.active} active</span>
            <span className="text-gray-500 dark:text-gray-400">{stockCard.inactive} inactive</span>
          </div>
        </div>
      </div>

      {/* Accounting Summary */}
      {accountingData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Accounting Summary (This Month)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {fmt(parseFloat(accountingData.expenses?.total_expenses || 0))}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {accountingData.expenses?.by_category?.length || 0} categories
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Income</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {fmt(parseFloat(accountingData.payments?.total_income || 0))}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {accountingData.payments?.pending_count || 0} pending
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net Profit</p>
              <p className={`text-lg font-bold ${
                (accountingData.profitLoss?.net_profit || 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {fmt(Math.abs(parseFloat(accountingData.profitLoss?.net_profit || 0)))}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {accountingData.profitLoss?.profit_margin || 0}% margin
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tax Due</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {fmt(parseFloat(accountingData.taxes?.total_due || 0))}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                {accountingData.taxes?.upcoming?.length || 0} upcoming
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          Critical Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(critical_alerts).map(([key, alert]) => {
            if (alert.count === 0) return null;
            
            const severityColors = {
              critical: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
              error: 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
              warning: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
              info: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
            };

            return (
              <div 
                key={key}
                className={`border-2 rounded-lg p-4 ${severityColors[alert.severity]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-2xl">{alert.count}</span>
                  {alert.severity === 'critical' && <XCircle className="w-5 h-5" />}
                  {alert.severity === 'warning' && <AlertTriangle className="w-5 h-5" />}
                </div>
                <p className="text-sm">{alert.message}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts & Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contacts (auto-sync)</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Last sync: {lastUpdated || '—'}</span>
        </div>
        {contactsToShow.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No contacts yet. Add a customer or capture one from a new order.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {contactsToShow.map((contact) => (
                <div key={contact.id || contact.phone || contact.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{contact.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{contact.totalDebt ? `Debt: ${fmt(contact.totalDebt)}` : 'Synced'}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">Live</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{contact.address}</span>
                      </div>
                    )}
                  </div>
                  {contact.updatedAt && (
                    <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">Updated {new Date(contact.updatedAt).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
            {Array.isArray(contacts) && ((isLargeScreen && contacts.length > 8) || (!isLargeScreen && contacts.length > 4)) && (
              <div className="flex justify-center mt-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  onClick={() => setShowAllContacts((prev) => !prev)}
                >
                  {showAllContacts ? 'Show Less' : `More (${contacts.length - (isLargeScreen ? 8 : 4)} more contacts)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Charts & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Sales Trend (Last 30 Days)
          </h2>
          <div style={{ height: '300px' }}>
            <Line data={salesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            Order Status Breakdown
          </h2>
          <div style={{ height: '300px' }} className="flex items-center justify-center">
            <Doughnut data={orderStatusChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Latest Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest Orders</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {safeRecentActivity.latest_orders.map(order => (
              <div key={order.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{order.items_count} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{fmt(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Updates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Stock Updates</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {safeRecentActivity.stock_updates.map(product => (
              <div key={product.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Stock: <span className={`font-bold ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock <= 10 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>{product.stock}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {product.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Updated: {new Date(product.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link 
            to="/product"
            className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Add Product</span>
          </Link>
          <Link 
            to="/inventory"
            className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            <span className="text-sm">Manage Stock</span>
          </Link>
          <Link 
            to="/manual-entry"
            className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm">New Order</span>
          </Link>
          <Link 
            to="/orders"
            className="bg-indigo-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">View Orders</span>
          </Link>
          <Link 
            to="/accounting"
            className="bg-cyan-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-700 transition-colors"
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Accounting</span>
          </Link>
          <Link 
            to="/analytics"
            className="bg-orange-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
          >
            <BarChart className="w-5 h-5" />
            <span className="text-sm">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stock Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 md:p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-2">Total Stock</p>
            <p className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stockMetrics.total_stock}</p>
            <p className="text-[8px] md:text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span className="block">Value:</span>
              <span className="block">{fmt(stockValue.total)}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 md:p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-2">Current Stock</p>
            <p className="text-xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stockMetrics.current_stock}</p>
            <p className="text-[8px] md:text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span className="block">Value:</span>
              <span className="block">{fmt(stockValue.current)}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 md:p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-2">Old Stock</p>
            <p className="text-xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{kpi_cards?.stock?.old_stock ?? 0}</p>
            <p className="text-[8px] md:text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span className="block">Value:</span>
              <span className="block">{fmt(kpi_cards?.stock?.old_stock_value ?? 0)}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 md:p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-2">Expired Stock</p>
            <p className="text-xl md:text-3xl font-bold text-red-600 dark:text-red-400">{kpi_cards?.stock?.expired_stock ?? 0}</p>
            <p className="text-[8px] md:text-xs text-gray-500 dark:text-gray-500 mt-1">
              <span className="block">Value:</span>
              <span className="block">{fmt(kpi_cards?.stock?.expired_stock_value ?? 0)}</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
