import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, TrendingUp, ShoppingCart, Users, AlertTriangle, 
  XCircle, DollarSign, Activity, RefreshCw,
  Plus, Clock, CheckCircle,
  ArrowUp, ArrowDown, Bell, X, FileText, BarChart,
  Phone, Mail, MapPin
} from 'lucide-react';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import { fetchWithAuth } from '../api';
import { useConfig } from '../context/ConfigContext';
import SchoolDashboard from './SchoolDashboard';
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
  const { pricingSettings, businessType } = useConfig();
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
    // School type check — must be after all hooks
    if (businessType && ['school', 'schools', 'education', 'School'].includes(String(businessType))) {
      return <SchoolDashboard />;
    }
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

  // School type — render school dashboard instead
  if (businessType && ['school', 'schools', 'education', 'School'].includes(String(businessType))) {
    return <SchoolDashboard />;
  }

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

  // Generate mock data for charts
  const generateMonthData = () => {
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(Math.floor(Math.random() * 50000) + 10000);
    }
    return { labels, data };
  };

  const monthData = generateMonthData();

  // Chart configurations
  const lineChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: 500 }
        }
      },
      filler: true
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // Chart data
  const feesChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Fees Paid',
      data: monthData.data,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(34, 197, 94)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const teacherPayChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Teacher Payments',
      data: monthData.data.map(v => Math.floor(v * 0.8)),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const attendanceChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Attendance Rate %',
      data: monthData.data.map(() => Math.floor(Math.random() * 30) + 70),
      borderColor: 'rgb(168, 85, 247)',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(168, 85, 247)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const performanceChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Performance Score',
      data: monthData.data.map(() => Math.floor(Math.random() * 40) + 60),
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(249, 115, 22)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const expensesChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Expenses',
      data: monthData.data.map(v => Math.floor(v * 0.4)),
      borderColor: 'rgb(239, 68, 68)',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(239, 68, 68)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const debtsChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Outstanding Debts',
      data: monthData.data.map(v => Math.floor(v * 0.2)),
      borderColor: 'rgb(236, 72, 153)',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(236, 72, 153)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  const utilitiesChartData = {
    labels: monthData.labels,
    datasets: [{
      label: 'Utilities Cost',
      data: monthData.data.map(v => Math.floor(v * 0.15)),
      borderColor: 'rgb(14, 165, 233)',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'rgb(14, 165, 233)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6"
      style={{ animation: 'dashFadeIn 0.6s ease both' }}
    >
      <style>{`@keyframes dashFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">School Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* School Fees Paid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">School Fees Paid</h2>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={feesChartData} options={lineChartConfig} />
          </div>
        </div>

        {/* Teacher Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Teacher Payments</h2>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={teacherPayChartData} options={lineChartConfig} />
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Attendance</h2>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={attendanceChartData} options={lineChartConfig} />
          </div>
        </div>

        {/* Performance by Class */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Class Performance</h2>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={performanceChartData} options={lineChartConfig} />
          </div>
        </div>
      </div>

      {/* Bottom Row - 3 Column Layout (Responsive) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h2>
              <BarChart className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={expensesChartData} options={lineChartConfig} />
          </div>
        </div>

        {/* Outstanding Debts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Outstanding Debts</h2>
              <AlertTriangle className="w-5 h-5 text-pink-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={debtsChartData} options={lineChartConfig} />
          </div>
        </div>

        {/* Utilities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Utilities Costs</h2>
              <Package className="w-5 h-5 text-sky-500" />
            </div>
          </div>
          <div className="p-6" style={{ height: '300px' }}>
            <Line data={utilitiesChartData} options={lineChartConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
