import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/pricingHelpers';
import {
  fetchMonthlyForecast,
  fetchFinancialForecast,
  fetchGeographicForecast,
  fetchRisksForecast,
  fetchPricingForecast,
  fetchNinetyDayForecast,
  fetchCustomsForecast,
  fetchOtherForecast
} from '../api/forecast';
import {
  TrendingUp, TrendingDown, AlertTriangle, Package, Users, DollarSign,
  BarChart3, Activity, Target, Calendar, Filter, Download, Settings,
  MapPin, Smartphone, Globe, CreditCard, Zap, Bell, RefreshCw,
  ArrowUp, ArrowDown, Minus, Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Forecast() {
  const toast = useToast();
  const { pricingSettings } = useConfig();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [scenario, setScenario] = useState('expected');
  const [priceType, setPriceType] = useState('both');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [growthPeriod, setGrowthPeriod] = useState('MoM');
  const [showGrowthDetails, setShowGrowthDetails] = useState(false);
  const [data, setData] = useState({});

  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  useEffect(() => {
    loadForecastData();
  }, [dateRange, scenario, priceType, selectedCategory, customDateFrom, customDateTo]);

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
      const tenantId = activeTenant?.uuid;
      const now = new Date();
      const targetMonth = now.getMonth() + 1;

      if (!tenantId) {
        toast.error('No active tenant found. Please select a tenant.');
        setData({});
        setLoading(false);
        return;
      }

      let forecastResponse;
      if (dateRange === '90d') {
        forecastResponse = await fetchNinetyDayForecast(tenantId);
      } else if (dateRange === 'custom') {
        forecastResponse = await fetchCustomsForecast(tenantId);
      } else if (activeTab === 'financial') {
        forecastResponse = await fetchFinancialForecast(tenantId);
      } else if (activeTab === 'geographic') {
        forecastResponse = await fetchGeographicForecast(tenantId);
      } else if (activeTab === 'risks') {
        forecastResponse = await fetchRisksForecast(tenantId);
      } else if (activeTab === 'pricing') {
        forecastResponse = await fetchPricingForecast(tenantId);
      } else if (activeTab === 'other') {
        forecastResponse = await fetchOtherForecast(tenantId);
      } else {
        forecastResponse = await fetchMonthlyForecast(tenantId, targetMonth);
      }

      const forecastSales = parseFloat(forecastResponse.forecast_sales || 0);
      const baseline = parseFloat(forecastResponse.baseline || 0);
      const growthRate = baseline > 0 ? ((forecastSales - baseline) / baseline) * 100 : 0;

      setData({
        kpis: {
          forecastRevenue: forecastSales,
          expectedOrders: Math.floor(forecastSales / 150),
          forecastProfit: forecastSales * 0.25,
          inventoryRisk: forecastResponse.restock_required ? 75 : 15,
          confidenceLevel: 85,
          growthRate: {
            MoM: {
              rate: growthRate,
              confidence: 85,
              comparison: 'vs baseline',
              previousRevenue: baseline,
              currentRevenue: forecastSales,
              retailGrowth: null,
              wholesaleGrowth: null,
              drivers: forecastResponse.sales_increase_hints || []
            },
            QoQ: { rate: null, confidence: null, comparison: 'Not enough data', previousRevenue: null, currentRevenue: null, drivers: [] },
            YoY: { rate: null, confidence: null, comparison: 'Not enough data', previousRevenue: null, currentRevenue: null, drivers: [] }
          }
        },
        salesForecast: {
          revenue: {
            daily: [],
            growth: growthRate,
            comparison: { actual: baseline, forecast: forecastSales }
          },
          products: forecastResponse.suggested_products || [],
          categories: []
        },
        demand: { orderVolume: [], peakPeriods: [], customers: {} },
        inventory: {
          stockForecast: [],
          alerts: forecastResponse.restock_required
            ? [{ type: 'restock', message: `Restock required: ${forecastResponse.restock_window}`, severity: 'critical' }]
            : []
        },
        pricing: { profit: {}, simulation: [] },
        marketing: { campaigns: [] },
        geographic: { regions: [], channels: [] },
        financial: { cashFlow: {} },
        risks: forecastResponse.sales_increase_hints?.length
          ? []
          : [{ type: 'no_growth', message: 'No major seasonal increases expected', probability: 10 }]
      });
    } catch (err) {
      console.error('Failed to load forecast data:', err);
      toast.error('Failed to load forecast data');
      setData({});
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadForecastData();
    setRefreshing(false);
    toast.success('Forecast data refreshed');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'sales', label: 'Sales Forecast', icon: TrendingUp },
    { id: 'demand', label: 'Demand & Customers', icon: Users },
    { id: 'inventory', label: 'Inventory & Supply', icon: Package },
    { id: 'pricing', label: 'Pricing & Profit', icon: DollarSign },
    { id: 'marketing', label: 'Marketing', icon: Target },
    { id: 'geographic', label: 'Geographic & Channels', icon: MapPin },
    { id: 'financial', label: 'Financial & Cash Flow', icon: CreditCard },
    { id: 'risks', label: 'Risk & Anomalies', icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse" />
          <p className="text-gray-600">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forecast</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICard
          title="Forecast Revenue"
          value={fmt(data.kpis?.forecastRevenue || 0)}
          icon={DollarSign}
          color="green"
          trend="up"
          change="+12.5%"
        />
        <KPICard
          title="Expected Orders"
          value={data.kpis?.expectedOrders || 0}
          icon={Package}
          color="blue"
          trend="up"
          change="+8.2%"
        />
        <KPICard
          title="Forecast Profit"
          value={fmt(data.kpis?.forecastProfit || 0)}
          icon={TrendingUp}
          color="purple"
          trend="up"
          change="+15.3%"
        />
        <KPICard
          title="Inventory Risk"
          value={`${data.kpis?.inventoryRisk || 0}%`}
          icon={AlertTriangle}
          color="orange"
          trend="down"
          change="-3.1%"
        />
        <KPICard
          title="Confidence Level"
          value={`${data.kpis?.confidenceLevel || 0}%`}
          icon={Target}
          color="teal"
          trend="stable"
        />
        <GrowthRateCard
          data={data.kpis?.growthRate}
          period={growthPeriod}
          onPeriodChange={setGrowthPeriod}
          onShowDetails={() => setShowGrowthDetails(true)}
          fmt={fmt}
        />
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range */}
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
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
              className="border rounded-lg px-2 sm:px-3 py-2 text-sm min-w-0"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="1y">1 Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          {/* Scenario */}
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="border rounded-lg px-2 sm:px-3 py-2 text-sm min-w-0"
            >
              <option value="best">Best Case</option>
              <option value="expected">Expected</option>
              <option value="worst">Worst Case</option>
            </select>
          </div>

          {/* Price Type */}
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="border rounded-lg px-2 sm:px-3 py-2 text-sm min-w-0"
            >
              <option value="both">Retail & Wholesale</option>
              <option value="retail">Retail Only</option>
              <option value="wholesale">Wholesale Only</option>
            </select>
          </div>
        </div>
        
        {/* Custom Date Range */}
        {showCustomDateRange && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Date Range</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To Date</label>
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
                  if (customDateFrom && customDateTo) {
                    // Apply custom date range
                    loadForecastData();
                    toast.success('Custom date range applied');
                  } else {
                    toast.error('Please select both from and to dates');
                  }
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

      {/* Tabs */}
      <div className="flex justify-between sm:justify-start sm:gap-2 border-b border-gray-200 overflow-x-auto pb-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 font-medium transition-colors flex-1 sm:flex-initial text-xs sm:text-sm ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-center">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'overview' && <OverviewTab data={data} fmt={fmt} />}
        {activeTab === 'sales' && <SalesForecastTab data={data.salesForecast} fmt={fmt} scenario={scenario} />}
        {activeTab === 'demand' && <DemandTab data={data.demand} fmt={fmt} />}
        {activeTab === 'inventory' && <InventoryTab data={data.inventory} />}
        {activeTab === 'pricing' && <PricingTab data={data.pricing} fmt={fmt} />}
        {activeTab === 'marketing' && <MarketingTab data={data.marketing} fmt={fmt} />}
        {activeTab === 'geographic' && <GeographicTab data={data.geographic} fmt={fmt} />}
        {activeTab === 'financial' && <FinancialTab data={data.financial} fmt={fmt} />}
        {activeTab === 'risks' && <RisksTab data={data.risks} />}
      </div>

      {/* Growth Rate Details Modal */}
      {showGrowthDetails && (
        <GrowthDetailsModal
          data={data.kpis?.growthRate?.[growthPeriod]}
          period={growthPeriod}
          onClose={() => setShowGrowthDetails(false)}
          fmt={fmt}
        />
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend, change }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600'
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        {change && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{change}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Overview Tab
function OverviewTab({ data, fmt }) {
  return (
    <div className="space-y-6">
      {/* Revenue Forecast Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Forecast Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.salesForecast?.revenue?.daily?.slice(0, 30) || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => [fmt(value), '']} />
            <Area type="monotone" dataKey="bestCase" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            <Area type="monotone" dataKey="forecast" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Area type="monotone" dataKey="worstCase" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
            <Line type="monotone" dataKey="actual" stroke="#1f2937" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InsightCard
          title="Top Forecasted Product"
          value={data.salesForecast?.products?.[0]?.name || 'N/A'}
          subtitle={data.salesForecast?.products?.[0] ? fmt(data.salesForecast.products[0].forecast) : 'No data'}
          icon={Package}
          color="blue"
        />
        <InsightCard
          title="Forecast vs Baseline"
          value={data.salesForecast?.revenue?.growth != null ? `${data.salesForecast.revenue.growth.toFixed(1)}%` : 'N/A'}
          subtitle="Growth from baseline"
          icon={TrendingUp}
          color="green"
        />
        <InsightCard
          title="Inventory Alert"
          value={data.inventory?.alerts?.length ? `${data.inventory.alerts.length} Alert(s)` : 'No Alerts'}
          subtitle={data.inventory?.alerts?.[0]?.message || 'All clear'}
          icon={AlertTriangle}
          color={data.inventory?.alerts?.length ? 'red' : 'blue'}
        />
      </div>

      {/* AI Recommendations */}
      {data.kpis?.growthRate?.MoM?.drivers?.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Forecast Insights
          </h3>
          <div className="space-y-3">
            {data.kpis.growthRate.MoM.drivers.map((driver, i) => (
              <RecommendationItem key={i} text={driver} priority={i === 0 ? 'high' : 'medium'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sales Forecast Tab
function SalesForecastTab({ data, fmt, scenario }) {
  if (!data) return <div>Loading sales forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Revenue Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Revenue Forecast</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              Forecast
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-700 rounded"></div>
              Actual
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Growth Rate</p>
            <p className="text-2xl font-bold text-green-600">+{data.revenue?.growth || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Forecast vs Actual</p>
            <p className="text-2xl font-bold">{fmt(data.revenue?.comparison?.forecast || 0)}</p>
            <p className="text-sm text-gray-500">vs {fmt(data.revenue?.comparison?.actual || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="text-2xl font-bold text-blue-600">85%</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.revenue?.daily || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => [fmt(value), '']} />
            <Line type="monotone" dataKey="actual" stroke="#1f2937" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="bestCase" stroke="#10b981" strokeWidth={1} strokeDasharray="2 2" />
            <Line type="monotone" dataKey="worstCase" stroke="#ef4444" strokeWidth={1} strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Product-Level Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Top Forecasted Products</h3>
          <div className="space-y-4">
            {data.products?.map((product, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.units} units</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(product.forecast)}</p>
                  <p className="text-xs text-gray-500">R:{product.retailSplit}% W:{product.wholesaleSplit}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Category Forecast</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.categories || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [fmt(value), 'Forecast']} />
              <Bar dataKey="forecast" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Demand Tab
function DemandTab({ data, fmt }) {
  if (!data) return <div>Loading demand forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Order Volume Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Order Volume & AOV Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.orderVolume || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" />
            <Line yAxisId="right" type="monotone" dataKey="aov" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Customer Behavior Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="font-medium">New Customers</span>
          </div>
          <p className="text-2xl font-bold">{data.customers?.new || 0}</p>
          <p className="text-sm text-green-600">+15% vs last month</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="font-medium">Returning</span>
          </div>
          <p className="text-2xl font-bold">{data.customers?.returning || 0}</p>
          <p className="text-sm text-blue-600">+8% vs last month</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <span className="font-medium">Churn Risk</span>
          </div>
          <p className="text-2xl font-bold">{data.customers?.churn || 0}%</p>
          <p className="text-sm text-red-600">-2% vs last month</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-500" />
            <span className="font-medium">CLV Forecast</span>
          </div>
          <p className="text-2xl font-bold">{fmt(data.customers?.clv || 0)}</p>
          <p className="text-sm text-purple-600">+12% vs last month</p>
        </div>
      </div>

      {/* Peak Demand Periods */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Peak Demand Alerts</h3>
        <div className="space-y-3">
          {data.peakPeriods?.map((period, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium">High demand expected</p>
                <p className="text-sm text-gray-600">{new Date(period).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inventory Tab
function InventoryTab({ data }) {
  if (!data) return <div>Loading inventory forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Stock Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Depletion Forecast</h3>
        <div className="space-y-4">
          {data.stockForecast?.map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              item.risk === 'critical' ? 'bg-red-50 border-red-200' :
              item.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.product}</p>
                  <p className="text-sm text-gray-600">Turnover: {item.turnover}x</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    item.risk === 'critical' ? 'text-red-600' :
                    item.risk === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {item.daysRemaining} days
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{item.risk} risk</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory Alerts</h3>
        <div className="space-y-3">
          {data.alerts?.map((alert, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
              alert.severity === 'critical' ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pricing Tab
function PricingTab({ data, fmt }) {
  if (!data) return <div>Loading pricing forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Profit Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Gross Profit</h4>
          <p className="text-3xl font-bold text-green-600">{fmt(data.profit?.gross || 0)}</p>
          <p className="text-sm text-gray-500 capitalize">{data.profit?.trend || 'stable'} trend</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Net Profit</h4>
          <p className="text-3xl font-bold text-blue-600">{fmt(data.profit?.net || 0)}</p>
          <p className="text-sm text-gray-500">After expenses</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Profit Margin</h4>
          <p className="text-3xl font-bold text-purple-600">{data.profit?.margin || 0}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full" 
              style={{ width: `${Math.min(data.profit?.margin || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Price Impact Simulation */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Price Change Impact Simulation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.simulation || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="change" tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`} />
            <YAxis tickFormatter={(value) => fmt(value)} />
            <Tooltip formatter={(value) => [fmt(value), 'Revenue Impact']} />
            <Bar dataKey="impact" fill={(entry) => entry.impact >= 0 ? '#10b981' : '#ef4444'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Marketing Tab
function MarketingTab({ data, fmt }) {
  if (!data) return <div>Loading marketing forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Campaign Performance Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign ROI Forecast</h3>
        <div className="space-y-4">
          {data.campaigns?.map((campaign, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{campaign.name}</h4>
                <span className="text-sm font-bold text-green-600">ROI: {campaign.roi}x</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Cost</p>
                  <p className="font-medium">{fmt(campaign.cost)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Revenue</p>
                  <p className="font-medium">{fmt(campaign.revenue)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Conversion</p>
                  <p className="font-medium">{campaign.conversion}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Geographic Tab
function GeographicTab({ data, fmt }) {
  if (!data) return <div>Loading geographic forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Regional Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Regional Sales Forecast</h3>
        <div className="space-y-4">
          {data.regions?.map((region, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{region.name}</p>
                <p className="text-sm text-green-600">+{region.growth}% growth</p>
              </div>
              <p className="font-bold">{fmt(region.forecast)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Channel Forecast */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Channel Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data.channels || []}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="forecast"
              label={({ name, share }) => `${name} (${share}%)`}
            >
              {data.channels?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [fmt(value), 'Forecast']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Financial Tab
function FinancialTab({ data, fmt }) {
  if (!data) return <div>Loading financial forecast...</div>;

  return (
    <div className="space-y-6">
      {/* Cash Flow Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Cash Inflow</h4>
          <p className="text-3xl font-bold text-green-600">{fmt(data.cashFlow?.inflow || 0)}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Expenses</h4>
          <p className="text-3xl font-bold text-red-600">{fmt(data.cashFlow?.expenses || 0)}</p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <h4 className="font-medium text-gray-600 mb-2">Net Position</h4>
          <p className="text-3xl font-bold text-blue-600">{fmt(data.cashFlow?.netPosition || 0)}</p>
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Break-even Forecast</h3>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Expected Break-even Date</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.cashFlow?.breakEven ? new Date(data.cashFlow.breakEven).toLocaleDateString('en', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            }) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Risks Tab
function RisksTab({ data }) {
  if (!data) return <div>Loading risk analysis...</div>;

  return (
    <div className="space-y-6">
      {/* Risk Alerts */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Forecast & Alerts</h3>
        <div className="space-y-4">
          {data.map((risk, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              risk.probability > 50 ? 'bg-red-50 border-red-200' :
              risk.probability > 25 ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{risk.message}</p>
                  <p className="text-sm text-gray-600 capitalize">{risk.type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    risk.probability > 50 ? 'text-red-600' :
                    risk.probability > 25 ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {risk.probability}%
                  </p>
                  <p className="text-xs text-gray-500">Probability</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InsightCard({ title, value, subtitle, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <span className="font-medium text-gray-700">{title}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

// Growth Rate Card Component
function GrowthRateCard({ data, period, onPeriodChange, onShowDetails, fmt }) {
  if (!data || !data[period] || data[period].rate === null) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="text-xs bg-transparent border-none p-0 font-medium"
            >
              <option value="MoM">MoM</option>
              <option value="QoQ">QoQ</option>
              <option value="YoY">YoY</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-1">Forecast Growth Rate</p>
        <p className="text-sm text-gray-400">Not enough data</p>
      </div>
    );
  }

  const growth = data[period];
  const rate = growth.rate || 0;
  const confidence = growth.confidence || 0;
  
  const getColor = () => {
    if (rate > 5) return 'green';
    if (rate < -5) return 'red';
    return 'yellow';
  };
  
  const getTrendIcon = () => {
    if (rate > 0) return ArrowUp;
    if (rate < 0) return ArrowDown;
    return Minus;
  };
  
  const color = getColor();
  const TrendIcon = getTrendIcon();
  
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };
  
  const borderStyle = confidence < 70 ? 'border-dashed' : 'border-solid';

  return (
    <div 
      className={`${colors[color]} border ${borderStyle} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onShowDetails}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="text-xs bg-transparent border-none p-0 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="MoM">MoM</option>
            <option value="QoQ">QoQ</option>
            <option value="YoY">YoY</option>
          </select>
        </div>
        <div className={`flex items-center gap-1 text-${color}-600`}>
          <TrendIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{rate > 0 ? '+' : ''}{rate.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">Forecast Growth Rate</p>
      <p className="text-2xl font-bold">{rate > 0 ? '+' : ''}{rate.toFixed(1)}%</p>
      <p className="text-xs text-gray-500 mt-1">{growth.comparison}</p>
      {confidence < 70 && (
        <p className="text-xs text-orange-600 mt-1">⚠ Low confidence ({confidence}%)</p>
      )}
    </div>
  );
}

// Growth Details Modal Component
function GrowthDetailsModal({ data, period, onClose, fmt }) {
  if (!data) return null;

  const absoluteChange = data.currentRevenue - data.previousRevenue;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Growth Rate Details ({period})</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-xl font-bold">{fmt(data.currentRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Previous Period</p>
              <p className="text-xl font-bold">{fmt(data.previousRevenue)}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Absolute Change</p>
            <p className={`text-xl font-bold ${absoluteChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {absoluteChange >= 0 ? '+' : ''}{fmt(absoluteChange)}
            </p>
          </div>
          
          {(data.retailGrowth !== null || data.wholesaleGrowth !== null) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Retail Growth</p>
                <p className="text-lg font-semibold text-blue-600">
                  {data.retailGrowth != null ? `+${data.retailGrowth}%` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wholesale Growth</p>
                <p className="text-lg font-semibold text-purple-600">
                  {data.wholesaleGrowth != null ? `+${data.wholesaleGrowth}%` : 'N/A'}
                </p>
              </div>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Top 3 Growth Drivers</p>
            <div className="space-y-1">
              {data.drivers?.map((driver, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function RecommendationItem({ text, priority }) {
  const colors = {
    high: 'bg-red-100 border-red-300 text-red-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    low: 'bg-blue-100 border-blue-300 text-blue-800'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`px-2 py-1 rounded text-xs font-medium ${colors[priority]}`}>
        {priority.toUpperCase()}
      </div>
      <p className="text-sm text-gray-700 flex-1">{text}</p>
    </div>
  );
}