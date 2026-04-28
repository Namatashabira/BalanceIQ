import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import aiAnalyticsAPI from '../api/aiAnalytics';
import openAIAPI from '../api/openai';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Users,
  DollarSign,
  Brain,
  BarChart3,
  Activity,
  Target,
  Lightbulb,
  RefreshCw,
  Sparkles,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Bell,
  Star
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function AIInsights() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    forecast: null,
    inventory: null,
    customers: null,
    profit: null,
    comprehensive: null,
    openai: null
  });
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  useEffect(() => {
    loadAllInsights();
  }, []);

  const loadAllInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const [comprehensive, forecast, inventory, customers, profit] = await Promise.all([
        aiAnalyticsAPI.getComprehensiveInsights(),
        aiAnalyticsAPI.getSalesForecast(90, 30),
        aiAnalyticsAPI.getInventoryOptimization(),
        aiAnalyticsAPI.getCustomerBehavior(90),
        aiAnalyticsAPI.getProfitPrediction(12)
      ]);

      setData({
        comprehensive: comprehensive.data?.data || comprehensive.data,
        forecast: forecast.data?.data || forecast.data,
        inventory: inventory.data?.data || inventory.data,
        customers: customers.data?.data || customers.data,
        profit: profit.data?.data || profit.data
      });
    } catch (error) {
      console.error('Error loading AI insights:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load AI insights';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllInsights();
    setRefreshing(false);
    toast.success('AI insights refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">Failed to Load AI Insights</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'openai', label: 'AI Suggestions', icon: Sparkles },
    { id: 'sales', label: 'Sales Forecast', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'profit', label: 'Profit/Loss', icon: DollarSign }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h1>
            <p className="text-gray-600">Smart analytics and predictions for your business</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/forecast"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Forecast
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab data={data.comprehensive} fmt={fmt} />}
        {activeTab === 'openai' && <OpenAITab />}
        {activeTab === 'sales' && <SalesForecastTab data={data.forecast} fmt={fmt} />}
        {activeTab === 'inventory' && <InventoryTab data={data.inventory} />}
        {activeTab === 'customers' && <CustomersTab data={data.customers} fmt={fmt} />}
        {activeTab === 'profit' && <ProfitTab data={data.profit} fmt={fmt} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, fmt }) {
  if (!data) return <div>Loading overview...</div>;

  const quickInsights = data.quick_insights || {};
  const inventory = data.inventory_alerts || {};
  const formatValue = fmt || ((v) => Number(v || 0).toLocaleString());

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sales Trend"
          value={quickInsights.sales_trend || 'stable'}
          icon={TrendingUp}
          color="blue"
          trend={quickInsights.sales_trend}
        />
        <StatCard
          title="Forecast Confidence"
          value={quickInsights.forecast_confidence || 'medium'}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Critical Inventory"
          value={quickInsights.critical_inventory_count || 0}
          icon={AlertTriangle}
          color="red"
          badge={quickInsights.critical_inventory_count > 0 ? 'Urgent' : 'OK'}
        />
        <StatCard
          title="Next 7 Days Sales"
          value={formatValue((quickInsights.next_7_days_prediction || 0).toFixed(2))}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Key Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sales_forecast?.insights?.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </div>

      {/* Critical Actions */}
      {inventory.critical_items && inventory.critical_items.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Urgent Actions Required</h2>
          </div>
          <div className="space-y-3">
            {inventory.critical_items.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <InsightText text={item.action} className="text-sm" />
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">{item.days_until_stockout.toFixed(1)} days</p>
                  <p className="text-sm text-gray-600">Stock: {item.current_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sales Forecast Tab Component
function SalesForecastTab({ data, fmt }) {
  if (!data) return <div>Loading sales forecast...</div>;

  const chartData = data.forecast?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: item.predicted_sales,
    confidence: item.confidence
  })) || [];
  const formatValue = fmt || ((value) => Number(value || 0).toLocaleString());

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            {data.trend === 'increasing' ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : data.trend === 'decreasing' ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Activity className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-semibold text-gray-700">Trend</span>
          </div>
          <p className="text-2xl font-bold capitalize">{data.trend}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Daily Sales</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(data.average_daily_sales?.toFixed(2))}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Confidence</p>
          <p className="text-2xl font-bold capitalize">{data.confidence}</p>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Sales Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#93c5fd" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-2">
          {data.insights?.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Inventory Tab Component
function InventoryTab({ data }) {
  if (!data) return <div>Loading inventory analysis...</div>;

  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-700">{summary.critical_count || 0}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 mb-1">Reorder Soon</p>
          <p className="text-3xl font-bold text-yellow-700">{summary.reorder_count || 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-1">Overstocked</p>
          <p className="text-3xl font-bold text-blue-700">{summary.overstock_count || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Optimal</p>
          <p className="text-3xl font-bold text-green-700">{summary.optimal_count || 0}</p>
        </div>
      </div>

      {/* Critical Items */}
      {data.critical_items && data.critical_items.length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Critical - Immediate Action Required
          </h3>
          <div className="space-y-3">
            {data.critical_items.map((item, index) => (
              <InventoryItem key={index} item={item} priority="critical" />
            ))}
          </div>
        </div>
      )}

      {/* Reorder Soon */}
      {data.reorder_soon && data.reorder_soon.length > 0 && (
        <div className="bg-white border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Reorder Soon</h3>
          <div className="space-y-3">
            {data.reorder_soon.map((item, index) => (
              <InventoryItem key={index} item={item} priority="high" />
            ))}
          </div>
        </div>
      )}

      {/* Overstocked */}
      {data.overstocked && data.overstocked.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overstocked Items</h3>
          <div className="space-y-3">
            {data.overstocked.map((item, index) => (
              <InventoryItem key={index} item={item} priority="overstock" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inventory Item Component
function InventoryItem({ item, priority }) {
  const bgColor = priority === 'critical' ? 'bg-red-50' : priority === 'high' ? 'bg-yellow-50' : 'bg-blue-50';
  
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.product_name}</p>
          <InsightText text={item.action} className="text-sm" />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Current: {item.current_stock}</p>
          <p className="text-sm text-gray-600">Velocity: {item.daily_velocity}/day</p>
        </div>
      </div>
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <span className="text-sm text-gray-600">Recommended Stock: {item.recommended_stock}</span>
        <span className="text-sm font-semibold text-blue-600">Reorder: {item.reorder_quantity} units</span>
      </div>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ data, fmt }) {
  if (!data) return <div>Loading customer analysis...</div>;

  const metrics = data.metrics || {};
  const formatValue = fmt || ((value) => Number(value || 0).toLocaleString());

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.total_customers || 0}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue((metrics.total_revenue || 0).toFixed(2))}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue((metrics.avg_order_value || 0).toFixed(2))}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.total_orders || 0}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-2">
          {data.insights?.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </div>

      {/* Top Customers */}
      {data.segments?.high_value && data.segments.high_value.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 High-Value Customers</h3>
          <div className="space-y-3">
            {data.segments.high_value.map((customer, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{customer.customer_id}</p>
                  <p className="text-sm text-gray-600">{customer.order_count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatValue(customer.total_spent.toFixed(2))}</p>
                  <p className="text-sm text-gray-600">Avg: {formatValue(customer.avg_order_value.toFixed(2))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            AI Recommendations
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <InsightItem key={index} insight={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Profit Tab Component
function ProfitTab({ data, fmt }) {
  if (!data) return <div>Loading profit predictions...</div>;

  const prediction = data.prediction || {};
  const trends = data.trends || {};
  const formatValue = fmt || ((value) => Number(value || 0).toLocaleString());

  return (
    <div className="space-y-6">
      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-700 mb-2">Predicted Revenue</p>
          <p className="text-3xl font-bold text-green-900">{formatValue((prediction.next_month_revenue || 0).toFixed(2))}</p>
          <p className="text-sm text-green-600 mt-2 capitalize">{trends.revenue_trend}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 mb-2">Predicted Expenses</p>
          <p className="text-3xl font-bold text-red-900">{formatValue((prediction.next_month_expense || 0).toFixed(2))}</p>
          <p className="text-sm text-red-600 mt-2 capitalize">{trends.expense_trend}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-700 mb-2">Predicted Profit</p>
          <p className="text-3xl font-bold text-blue-900">{formatValue((prediction.next_month_profit || 0).toFixed(2))}</p>
          <p className="text-sm text-blue-600 mt-2 capitalize">{trends.profit_trend}</p>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Margin</h3>
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-blue-600">{(prediction.profit_margin || 0).toFixed(1)}%</div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${Math.min(prediction.profit_margin || 0, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {prediction.profit_margin < 15 ? 'Low margin' : prediction.profit_margin > 30 ? 'Healthy margin' : 'Good margin'}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights & Recommendations</h3>
        <div className="space-y-2">
          {data.insights?.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, trend, badge }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600'
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        {badge && (
          <span className={`text-xs px-2 py-1 rounded ${badge === 'Urgent' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold capitalize">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'increasing' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'decreasing' && <TrendingDown className="w-4 h-4 text-red-500" />}
          <span className="text-xs text-gray-600 capitalize">{trend}</span>
        </div>
      )}
    </div>
  );
}

// OpenAI Suggestions Tab Component
function OpenAITab() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [salesAnalysis, setSalesAnalysis] = useState(null);
  const [apiConfigured, setApiConfigured] = useState(true);

  const loadBusinessInsights = async () => {
    setLoading(true);
    try {
      const result = await openAIAPI.getBusinessInsights(30);
      
      if (result.success) {
        setInsights(result);
        setApiConfigured(true);
        toast.success('Loaded AI business insights');
      } else {
        if (result.error?.includes('not configured')) {
          setApiConfigured(false);
        }
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      if (error?.error?.includes('not configured')) {
        setApiConfigured(false);
      }
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryStrategy = async () => {
    setLoading(true);
    try {
      const result = await openAIAPI.getInventoryStrategy();
      if (result.success) {
        setStrategy(result);
        toast.success('Generated inventory strategy');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to generate strategy');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesAnalysis = async () => {
    setLoading(true);
    try {
      const result = await openAIAPI.getSalesAnalysis(30);
      if (result.success) {
        setSalesAnalysis(result);
        toast.success('Loaded sales analysis');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  if (!apiConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              OpenAI Configuration Required
            </h3>
            <p className="text-yellow-800 mb-4">
              To use AI-powered suggestions, you need to configure your OpenAI API key.
            </p>
            
            <div className="bg-white rounded-lg p-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Step 1:</span> Get your API key from{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </div>
              <div>
                <span className="font-semibold">Step 2:</span> Set environment variable:
                <code className="block mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                  OPENAI_API_KEY=sk-your-key-here
                </code>
              </div>
              <div>
                <span className="font-semibold">Step 3:</span> Restart your Django server
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Suggestions</h2>
        </div>
        <p className="text-gray-600">
          Get intelligent business recommendations powered by OpenAI GPT models
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={loadBusinessInsights}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50"
        >
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">Business Insights</p>
            <p className="text-sm text-gray-600">Get strategic recommendations</p>
          </div>
        </button>

        <button
          onClick={loadInventoryStrategy}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50"
        >
          <Package className="w-6 h-6 text-green-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">Inventory Strategy</p>
            <p className="text-sm text-gray-600">Smart reorder planning</p>
          </div>
        </button>

        <button
          onClick={loadSalesAnalysis}
          disabled={loading}
          className="flex items-center gap-3 p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50"
        >
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">Sales Analysis</p>
            <p className="text-sm text-gray-600">Trend insights</p>
          </div>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            <p className="text-gray-600">Generating AI suggestions...</p>
          </div>
        </div>
      )}

      {/* Business Insights */}
      {insights && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Business Intelligence Report</h3>
          </div>
          
          {insights.business_data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-blue-600">{insights.business_data.total_orders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-bold text-green-600">${insights.business_data.total_revenue?.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Avg Order</p>
                <p className="text-xl font-bold text-purple-600">${insights.business_data.average_order_value?.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-xl font-bold text-orange-600">{insights.business_data.total_products}</p>
              </div>
            </div>
          )}

          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4">
              {insights.insights}
            </div>
          </div>

          {insights.tokens_used && (
            <p className="text-xs text-gray-500 mt-4">
              Tokens used: {insights.tokens_used}
            </p>
          )}
        </div>
      )}

      {/* Inventory Strategy */}
      {strategy && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold">Inventory Management Strategy</h3>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4">
              {strategy.strategy}
            </div>
          </div>
        </div>
      )}

      {/* Sales Analysis */}
      {salesAnalysis && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Sales Trend Analysis</h3>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-lg p-4">
              {salesAnalysis.analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// InsightItem Component - Renders insights with proper icons
function InsightItem({ insight }) {
  // Icon mapping for different insight types
  const iconMap = {
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle,
    'arrow-right': ArrowRight,
    'lightbulb': Lightbulb,
    'dollar-sign': DollarSign,
    'bell': Bell,
    'package': Package,
    'bar-chart': BarChart3,
    'star': Star,
    'users': Users,
    'target': Target
  };

  // Color mapping for different icon types
  const colorMap = {
    'trending-up': 'text-green-600',
    'trending-down': 'text-red-600',
    'alert-triangle': 'text-yellow-600',
    'check-circle': 'text-green-600',
    'arrow-right': 'text-blue-600',
    'lightbulb': 'text-yellow-500',
    'dollar-sign': 'text-green-600',
    'bell': 'text-orange-600',
    'package': 'text-blue-600',
    'bar-chart': 'text-purple-600',
    'star': 'text-yellow-500',
    'users': 'text-blue-600',
    'target': 'text-purple-600'
  };

  // Extract icon identifier from insight text
  const iconMatch = insight.match(/^\[([^\]]+)\]/);
  const iconKey = iconMatch ? iconMatch[1] : null;
  const text = iconKey ? insight.replace(/^\[[^\]]+\]\s*/, '') : insight;

  const IconComponent = iconKey ? iconMap[iconKey] : null;
  const iconColor = iconKey ? colorMap[iconKey] : 'text-gray-600';

  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded">
      {IconComponent ? (
        <IconComponent className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      ) : (
        <div className="w-5 h-5" />
      )}
      <p className="text-gray-700">{text}</p>
    </div>
  );
}
// InsightText Component - Renders text with inline icons (for action messages)
function InsightText({ text, className = '' }) {
  // Icon mapping for different insight types
  const iconMap = {
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'alert-triangle': AlertTriangle,
    'check-circle': CheckCircle,
    'arrow-right': ArrowRight,
    'lightbulb': Lightbulb,
    'dollar-sign': DollarSign,
    'bell': Bell,
    'package': Package,
    'bar-chart': BarChart3,
    'star': Star,
    'users': Users,
    'target': Target
  };

  // Color mapping for different icon types
  const colorMap = {
    'trending-up': 'text-green-600',
    'trending-down': 'text-red-600',
    'alert-triangle': 'text-red-600',
    'check-circle': 'text-green-600',
    'arrow-right': 'text-blue-600',
    'lightbulb': 'text-yellow-500',
    'dollar-sign': 'text-green-600',
    'bell': 'text-orange-600',
    'package': 'text-blue-600',
    'bar-chart': 'text-purple-600',
    'star': 'text-yellow-500',
    'users': 'text-blue-600',
    'target': 'text-purple-600'
  };

  // Extract icon identifier from text
  const iconMatch = text.match(/^\[([^\]]+)\]/);
  const iconKey = iconMatch ? iconMatch[1] : null;
  const cleanText = iconKey ? text.replace(/^\[[^\]]+\]\s*/, '') : text;

  const IconComponent = iconKey ? iconMap[iconKey] : null;
  const iconColor = iconKey ? colorMap[iconKey] : 'text-gray-600';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {IconComponent && (
        <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
      )}
      <span className="text-gray-600">{cleanText}</span>
    </div>
  );
}