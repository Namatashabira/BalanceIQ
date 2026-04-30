import { useState, useEffect, useCallback } from "react";
import { fetchAnalytics } from "../api";
import { getChartTheme } from "../utils/themeUtils";
import { useConfig } from "../context/ConfigContext";
import { formatCurrency, getCurrencyCode } from "../utils/pricingHelpers";
import { TrendingUp, WifiOff } from "lucide-react";
import { getAll, bulkUpsert } from '../services/localStore';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      if (navigator.onLine) {
        const data = await fetchAnalytics(dateRange);
        if (data) {
          await bulkUpsert('analytics', [{ id: `analytics_${dateRange}`, ...data }]);
          setAnalytics(data);
          setIsOffline(false);
        } else {
          setAnalytics(null);
        }
      } else {
        // Offline — load cached
        setIsOffline(true);
        const cached = await getAll('analytics');
        const entry = cached.find(r => r.id === `analytics_${dateRange}`) || cached.find(r => r.id?.startsWith('analytics_'));
        setAnalytics(entry || null);
      }
    } catch {
      // Network failed — try cache
      setIsOffline(true);
      try {
        const cached = await getAll('analytics');
        const entry = cached.find(r => r.id === `analytics_${dateRange}`) || cached.find(r => r.id?.startsWith('analytics_'));
        setAnalytics(entry || null);
      } catch {
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const onOnline  = () => { setIsOffline(false); loadAnalytics(); };
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [loadAnalytics]);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  if (loading) return <div className="p-4">Loading analytics...</div>;
  if (!analytics) {
    if (isOffline) return (
      <div className="p-8 text-center">
        <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">You're offline</p>
        <p className="text-gray-400 text-sm mt-1">No cached analytics available. Connect to load data.</p>
      </div>
    );
    const lastError = window.__lastAnalyticsError;
    if (lastError && lastError.includes('403')) {
      return <div className="p-4 text-red-600">Access denied. Admin access required to view analytics.</div>;
    }
    return <div className="p-4">No analytics data available.</div>;
  }

  // Defensive fallbacks to prevent crashes when backend omits fields
  const revenueTrend = Array.isArray(analytics?.revenue_trend) ? analytics.revenue_trend : [];
  const ordersByStatus = Array.isArray(analytics?.orders_by_status) ? analytics.orders_by_status : [];
  const topProducts = Array.isArray(analytics?.top_products) ? analytics.top_products : [];
  const dailyOrders = Array.isArray(analytics?.daily_orders) ? analytics.daily_orders : [];

  const predictive = analytics?.predictive_analytics || {};
  const historicalData = Array.isArray(predictive.historical_data) ? predictive.historical_data : [];
  const forecastData = Array.isArray(predictive.predictions) ? predictive.predictions : [];

  const cohortCohorts = Array.isArray(analytics?.cohort_analysis?.cohorts) ? analytics.cohort_analysis.cohorts : [];
  const funnelSteps = Array.isArray(analytics?.funnel_analysis?.funnel_steps) ? analytics.funnel_analysis.funnel_steps : [];

  const revenueTrendMax = revenueTrend.length ? Math.max(0, ...revenueTrend.map(d => d.revenue || 0)) : 0;
  const dailyOrdersMax = dailyOrders.length ? Math.max(1, ...dailyOrders.map(d => d.count || 0)) : 1;
  const forecastMax = (() => {
    const combined = [...historicalData.map(d => d.actual_revenue || 0), ...forecastData.map(d => d.predicted_revenue || 0)];
    return combined.length ? Math.max(1, ...combined) : 1;
  })();

  return (
    <div className="p-2 sm:p-4 w-full overflow-x-hidden space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-3">
          {isOffline && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 border border-yellow-300 px-3 py-1.5 rounded-full">
              <WifiOff className="w-3.5 h-3.5" /> Offline — cached data
            </span>
          )}
          <a
            href="/forecast"
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Forecast
          </a>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg shadow-sm bg-white"
          >
            <option value="1d">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            title: "Total Revenue",
            value: fmt(analytics.total_revenue || 0),
            color: "blue",
            growth: analytics.revenue_growth,
          },
          {
            title: "Total Orders",
            value: analytics.total_orders || 0,
            color: "green",
            growth: analytics.orders_growth,
          },
          {
            title: "Avg Order Value",
            value:
              analytics.total_orders > 0
                ? fmt(Math.round((analytics.total_revenue || 0) / analytics.total_orders))
                : fmt(0),
            color: "purple",
          },
          {
            title: "Active Users",
            value: analytics.active_users || 0,
            color: "orange",
          },
          {
            title: "Conversion Rate",
            value: `${analytics.conversion_rate || 0}%`,
            color: "teal",
          },
          {
            title: "Pending Orders",
            value: analytics.pending_orders || 0,
            color: "red",
          },
        ].map((item) => (
          <div
            key={item.title}
            className={`bg-${item.color}-50 p-3 rounded-xl border border-${item.color}-200 shadow-sm`}
          >
            <h3 className={`text-sm font-medium text-${item.color}-700 truncate`}>
              {item.title}
            </h3>
            <p className={`text-2xl font-bold text-${item.color}-900`}>
              {item.value}
            </p>

            {item.growth !== undefined && (
              <p
                className={`text-xs ${
                  item.growth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {item.growth >= 0 ? "↗" : "↘"} {Math.abs(item.growth)}%
              </p>
            )}
          </div>
        ))}
      </div>

      {/* REVENUE TREND */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Revenue Trend</h2>
          <span className="text-sm text-gray-500">
            Total: {fmt(revenueTrend.reduce((sum, d) => sum + (d.revenue || 0), 0))}
          </span>
        </div>

        {/* Prevent overflow */}
        <div className="overflow-x-auto">
          <div className="relative flex items-end space-x-1 h-64 min-w-[700px] pb-16 pt-4" style={{ background: 'linear-gradient(to top, #f9fafb 0%, transparent 100%)' }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-200"
                style={{ bottom: `${percent * 0.64 + 64}px` }}
              >
                <span className="absolute -left-2 -top-3 text-xs text-gray-400">
                  {Math.round((percent / 100) * revenueTrendMax)}
                </span>
              </div>
            ))}
            
            {revenueTrend.map((day) => {
              const max = revenueTrendMax || 1;
              const height = Math.max((day.revenue / max) * 160, 8);
              const chartTheme = getChartTheme();
              
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center min-w-[40px] group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    <div className="text-xs font-semibold">{new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-sm font-bold">{fmt(day.revenue)}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                  
                  {/* Bar with gradient and shadow */}
                  <div
                    className="w-full rounded-t transition-all duration-300 group-hover:brightness-110 relative overflow-hidden"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top, ${chartTheme.primary}, ${chartTheme.primary}dd)`,
                      boxShadow: '0 -2px 8px rgba(0,0,0,0.1), inset 0 -2px 0 rgba(255,255,255,0.3)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  
                  {/* Date label */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-full">
                    <span className="text-xs text-gray-600 font-medium block text-center">
                      {new Date(day.date).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-gray-800 font-bold block text-center mt-1">
                      {(day.revenue / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SEGMENTATION CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders by status */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <div className="space-y-2">
            {ordersByStatus.map((item) => (
              <div
                key={item.status}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span className="capitalize">{item.status}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <div className="space-y-2">
            {topProducts.map((item) => (
              <div
                key={item.name}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span className="truncate max-w-[120px]">{item.name}</span>
                <span className="font-semibold">{item.sales}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User metrics */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">User Metrics</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>New Users</span>
              <span className="font-semibold">{analytics.new_users ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Returning Users</span>
              <span className="font-semibold">{analytics.returning_users ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Repeat Purchase Rate</span>
              <span className="font-semibold">{analytics.repeat_rate ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY ORDERS */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Order Volume Trend</h2>
          <span className="text-sm text-gray-500">
            Total: {dailyOrders.reduce((sum, d) => sum + (d.count || 0), 0)} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="relative flex items-end space-x-2 h-48 min-w-[600px] pb-12 pt-4" style={{ background: 'linear-gradient(to top, #eff6ff 0%, transparent 100%)' }}>
            {dailyOrders.map((day) => {
              const height = Math.max(((day.count || 0) / dailyOrdersMax) * 140, 8);
              const chartTheme = getChartTheme();
              
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center min-w-[50px] group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    <div className="text-xs font-semibold">{new Date(day.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div className="text-sm font-bold">{day.count} orders</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                  
                  {/* Bar */}
                  <div
                    className="w-full rounded-t transition-all duration-300 group-hover:brightness-110 relative overflow-hidden"
                    style={{
                      height: `${height}px`,
                      background: `linear-gradient(to top, ${chartTheme.secondary}, ${chartTheme.secondary}dd)`,
                      boxShadow: '0 -2px 8px rgba(0,0,0,0.1), inset 0 -2px 0 rgba(255,255,255,0.3)',
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                    <span className="text-xs text-gray-600 font-medium block text-center">
                      {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                    </span>
                    <span className="text-xs text-gray-800 font-bold block text-center mt-1">{day.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== ADVANCED ANALYTICS ===== */}

      <div className="space-y-6">

        {/* PREDICTIONS */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Revenue Forecast</h3>
              <p className="text-sm text-gray-500 mt-1">Historical data + 30-day prediction</p>
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-3 rounded" style={{ backgroundColor: getChartTheme().primary }}></span>
                  <span className="text-gray-600">Actual</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-3 rounded" style={{ backgroundColor: getChartTheme().accent }}></span>
                  <span className="text-gray-600">Forecast</span>
                </span>
                <span className="text-gray-600">
                  Accuracy: <span className="font-semibold">{predictive?.forecast_accuracy ?? 0}%</span>
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="relative flex items-end space-x-1 h-72 min-w-[900px] pb-8 pt-4" style={{ background: 'linear-gradient(to top, #fafafa 0%, transparent 100%)' }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute w-full border-t border-dashed border-gray-200"
                  style={{ bottom: `${percent * 0.64 + 32}px` }}
                />
              ))}
              
              {/* Divider between historical and forecast */}
              <div className="absolute border-l-2 border-gray-300 border-dashed h-full" style={{ left: `${(30 / 45) * 100}%`, bottom: '32px' }}>
                <span className="absolute -top-2 left-2 text-xs text-gray-500 font-semibold bg-white px-2 py-1 rounded">Today</span>
              </div>

              {/* Historical */}
              {historicalData.map((day, index) => {
                const height = Math.max(((day.actual_revenue || 0) / forecastMax) * 220, 4);
                const chartTheme = getChartTheme();
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center min-w-[18px] group relative"
                  >
                    {index % 5 === 0 && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap text-xs">
                        <div className="font-semibold">{new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        <div className="font-bold">{fmt(day.actual_revenue)}</div>
                      </div>
                    )}
                    
                    <div
                      className="w-full rounded-t transition-all duration-200 group-hover:brightness-110"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, ${chartTheme.primary}, ${chartTheme.primary}dd)`,
                        boxShadow: '0 -1px 4px rgba(0,0,0,0.1)',
                      }}
                    ></div>
                  </div>
                );
              })}

              {/* Predictions */}
              {forecastData.slice(0, 15).map((day) => {
                const height = Math.max(((day.predicted_revenue || 0) / forecastMax) * 220, 4);
                const confidenceHeight = Math.max((((day.confidence_upper || 0) - (day.confidence_lower || 0)) / forecastMax) * 220, 2);
                const confidenceBottom = Math.max(((day.confidence_lower || 0) / forecastMax) * 220, 4);
                const chartTheme = getChartTheme();
                
                return (
                  <div
                    key={day.date}
                    className="relative flex-1 flex flex-col items-center min-w-[18px] group"
                  >
                    {/* Confidence interval */}
                    <div
                      className="absolute w-full rounded opacity-30"
                      style={{
                        height: `${confidenceHeight}px`,
                        bottom: `${confidenceBottom}px`,
                        backgroundColor: chartTheme.accent,
                      }}
                    ></div>

                    {/* Predicted value */}
                    <div
                      className="w-full rounded-t relative z-10 transition-all duration-200 group-hover:brightness-110"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(to top, ${chartTheme.accent}, ${chartTheme.accent}dd)`,
                        boxShadow: '0 -1px 4px rgba(0,0,0,0.1)',
                        border: `1px dashed ${chartTheme.accent}`,
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COHORT */}
        <div className="bg-white p-4 rounded-xl shadow-lg overflow-x-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">User Retention Cohort Analysis</h3>
          </div>

          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 border-b text-left">Cohort</th>
                <th className="p-2 border-b">Users</th>
                {[0, 1, 2, 3, 4, 5].map((m) => (
                  <th key={m} className="p-2 border-b">Month {m}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {cohortCohorts.map((cohort) => (
                <tr key={cohort.cohort_month}>
                  <td className="border-b p-2 font-medium">{cohort.cohort_month}</td>
                  <td className="border-b p-2 text-center">{cohort.initial_users}</td>

                  {[0, 1, 2, 3, 4, 5].map((m) => {
                    const r = cohort.retention_data?.find(
                      (x) => x.month === m
                    );
                    const rate = r?.retention_rate || 0;
                    return (
                      <td
                        key={m}
                        className="border-b p-2 text-center"
                        style={{
                          backgroundColor: `rgba(34,197,94,${rate / 100})`,
                          color: rate > 50 ? "white" : "black",
                        }}
                      >
                        {r ? `${rate}%` : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FUNNEL */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>

          <div className="space-y-4">
            {funnelSteps.map((step, i) => {
              const baseUsers = funnelSteps[0]?.users || 1;
              const width = (step.users / baseUsers) * 100;

              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-yellow-500",
                "bg-orange-500",
                "bg-red-500",
                "bg-purple-500",
              ];

              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{step.step}</span>
                    <span className="text-gray-600">
                      {step.users.toLocaleString()} ({step.conversion_rate}%)
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-7">
                    <div
                      className={`${colors[i]} h-7 rounded-full text-white flex items-center justify-center text-xs`}
                      style={{ width: `${width}%` }}
                    >
                      {step.users.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
