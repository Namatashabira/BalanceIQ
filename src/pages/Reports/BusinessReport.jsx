import React, { useState, useEffect } from 'react';
import {
  Calendar, Download, FileText, RefreshCw, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Users, Package, AlertCircle, CheckCircle,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title as ChartTitle, Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ChartTitle,
  Tooltip, Legend, ArcElement, PointElement, LineElement
);

const BASE_URL = 'http://127.0.0.1:8000/api';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

function currency(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(val);
}

function pct(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  return `${val.toFixed(1)}%`;
}

// ── Charts ──────────────────────────────────────────────────────────────────

const RevenueChart = ({ trends }) => {
  if (!trends?.length) return <p className="text-gray-400 text-sm text-center py-8">No trend data</p>;
  const chartData = {
    labels: trends.map(t => t.month),
    datasets: [{
      label: 'Revenue',
      data: trends.map(t => t.revenue),
      backgroundColor: 'rgba(59,130,246,0.5)',
      borderColor: 'rgb(59,130,246)',
      borderWidth: 2,
    }],
  };
  return <Bar data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Monthly Revenue Trend' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => 'UGX ' + v.toLocaleString() } } } }} />;
};

const OrderStatusPieChart = ({ statusDist }) => {
  const labels = Object.keys(statusDist || {});
  if (!labels.length) return <p className="text-gray-400 text-sm text-center py-8">No order data</p>;
  const chartData = {
    labels,
    datasets: [{
      data: Object.values(statusDist),
      backgroundColor: ['#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'],
      borderWidth: 2, borderColor: '#fff',
    }],
  };
  return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Order Status Distribution' } } }} />;
};

const TopProductsChart = ({ products }) => {
  if (!products?.length) return <p className="text-gray-400 text-sm text-center py-8">No product data</p>;
  const chartData = {
    labels: products.map(p => p.product_name),
    datasets: [{
      label: 'Revenue',
      data: products.map(p => parseFloat(p.revenue || 0)),
      backgroundColor: ['rgba(59,130,246,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)','rgba(139,92,246,0.8)'],
      borderWidth: 2,
    }],
  };
  return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Top Products by Revenue' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => 'UGX ' + v.toLocaleString() } } } }} />;
};

// ── UI Components ────────────────────────────────────────────────────────────

const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ title, rows, columns }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {title && <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">{title}</h3></div>}
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>{columns.map((c, i) => <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{c.title}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c, j) => <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

export default function BusinessReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/reports/saved/`, { headers: getAuthHeaders() });
      setSavedReports(res.data || []);
    } catch {
      // silent — saved reports are optional
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const res = await axios.get(`${BASE_URL}/reports/generate/`, {
        headers: getAuthHeaders(),
        params,
      });

      setReport(res.data.report);
      setBusinessName(res.data.business || '');
      await loadSavedReports();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSaved = (saved) => {
    setReport(saved.data);
    setBusinessName(saved.name || '');
    setStartDate(saved.start_date || '');
    setEndDate(saved.end_date || '');
    setShowSaved(false);
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;
      const res = await axios.get(`${BASE_URL}/reports/generate/pdf/`, {
        headers: getAuthHeaders(),
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `business_report_${startDate || 'all'}_${endDate || 'time'}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const sales = report?.sales?.metrics || {};
  const expenses = report?.expenses?.metrics || {};
  const orders = report?.orders || {};
  const inventory = report?.inventory?.metrics || {};
  const taxes = report?.taxes || {};
  const period = startDate && endDate ? `${startDate} to ${endDate}` : 'Current Month';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Report</h1>
              <p className="mt-1 text-sm text-gray-500">Comprehensive business performance analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Saved ({savedReports.length})
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={!report || pdfLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pdfLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Saved Reports Panel */}
        {showSaved && savedReports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Saved Reports</h3>
            <div className="space-y-2">
              {savedReports.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleLoadSaved(r)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.start_date} → {r.end_date} · Generated {new Date(r.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-500">to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              Generate Report
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <p className="text-lg text-gray-600">Generating report...</p>
          </div>
        )}

        {/* Report */}
        {report && !loading && (
          <div className="space-y-6">

            {/* Title */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{businessName}</h2>
              <h3 className="text-xl text-gray-600 mb-4">Business Performance Report</h3>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Period: {period}</span>
                <span className="flex items-center gap-1"><Activity className="h-4 w-4" /> Generated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Total Revenue" value={currency(sales.total_sales)} icon={DollarSign} color="green" />
              <MetricCard title="Total Orders" value={orders.total_orders ?? '—'} icon={ShoppingCart} color="blue" />
              <MetricCard title="Avg Order Value" value={currency(sales.average_order_value)} icon={TrendingUp} color="purple" />
              <MetricCard title="Fulfillment Rate" value={pct(orders.fulfillment_rate)} icon={CheckCircle} color="green" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <RevenueChart trends={sales.monthly_trends} />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <OrderStatusPieChart statusDist={orders.status_distribution} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <TopProductsChart products={sales.top_products} />
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Executive Summary
              </h3>
              <p className="text-gray-700 leading-relaxed">{report.executive_summary}</p>
            </div>

            {/* Sales */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Sales Performance
              </h3>
              <p className="text-gray-700 mb-6">{report.sales?.narrative}</p>
              <DataTable
                rows={[
                  { label: 'Total Revenue', value: currency(sales.total_sales) },
                  { label: 'Total Orders', value: sales.total_orders ?? '—' },
                  { label: 'Average Order Value', value: currency(sales.average_order_value) },
                  { label: 'Top Product', value: sales.top_products?.[0]?.product_name || '—' },
                ]}
                columns={[
                  { title: 'Metric', key: 'label' },
                  { title: 'Value', key: 'value' },
                ]}
              />
            </div>

            {/* Expenses + Taxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Expenses
                </h3>
                <p className="text-gray-700 mb-4">{report.expenses?.narrative}</p>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-semibold">{currency(expenses.total_expenses)}</span>
                  </div>
                  {expenses.breakdown?.map((b, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{b.category || 'Other'}</span>
                      <span className="font-semibold">{currency(parseFloat(b.total))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5" /> Tax Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">VAT Collected</span>
                    <span className="font-semibold">{currency(taxes.vat_collected)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" /> Inventory
              </h3>
              <p className="text-gray-700 mb-4">{report.inventory?.narrative}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{inventory.total_stock_items ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold">{currency(inventory.total_value)}</p>
                </div>
                <div className={`rounded-lg p-4 ${inventory.low_stock_items?.length ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className={`text-2xl font-bold ${inventory.low_stock_items?.length ? 'text-orange-600' : 'text-green-600'}`}>
                    {inventory.low_stock_items?.length ?? 0}
                  </p>
                </div>
              </div>
              {inventory.low_stock_items?.length > 0 && (
                <DataTable
                  title="Low Stock Products"
                  rows={inventory.low_stock_items}
                  columns={[
                    { title: 'Product', key: 'name' },
                    { title: 'Stock Remaining', key: 'stock' },
                  ]}
                />
              )}
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Key Insights
                </h3>
                <ul className="space-y-2">
                  {buildInsights(sales, expenses, orders, inventory).map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" /> Recommendations
                </h3>
                <ul className="space-y-2">
                  {buildRecommendations(sales, expenses, orders, inventory).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function buildInsights(sales, expenses, orders, inventory) {
  const insights = [];
  const profit = (sales.total_sales || 0) - (expenses.total_expenses || 0);
  if (profit > 0) insights.push(`Profitable period with net profit of ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(profit)}.`);
  if ((orders.fulfillment_rate || 0) >= 90) insights.push(`Strong fulfillment rate of ${(orders.fulfillment_rate || 0).toFixed(1)}%.`);
  if (!inventory.low_stock_items?.length) insights.push('All products have healthy stock levels.');
  if ((sales.total_orders || 0) > 0) insights.push(`Processed ${sales.total_orders} orders this period.`);
  if (!insights.length) insights.push('No data available for insights yet.');
  return insights;
}

function buildRecommendations(sales, expenses, orders, inventory) {
  const recs = [];
  const profit = (sales.total_sales || 0) - (expenses.total_expenses || 0);
  if (profit < 0) recs.push('Review and reduce operational expenses to restore profitability.');
  if ((orders.fulfillment_rate || 0) < 90) recs.push('Improve order fulfillment processes to exceed 90% rate.');
  if (inventory.low_stock_items?.length > 0) recs.push(`Restock ${inventory.low_stock_items.length} low-stock product(s) promptly.`);
  if ((sales.average_order_value || 0) > 0) recs.push('Consider upselling strategies to increase average order value.');
  if (!recs.length) recs.push('Continue current strategies and monitor performance regularly.');
  return recs;
}
