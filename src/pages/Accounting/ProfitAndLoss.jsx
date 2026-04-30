import { useState, useEffect, useCallback } from 'react';
import { DocumentArrowDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fetchProfitLoss } from '../../api/accounting';
import { getChartTheme } from '../../utils/themeUtils';
import { useToast } from '../../context/ToastContext';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';
import { getAll, bulkUpsert } from '../../services/localStore';

export default function ProfitAndLoss() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
  });
  const [periodType, setPeriodType] = useState('custom');

  const chartTheme = getChartTheme();
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  const loadData = useCallback(async () => {
    const cacheKey = `pl_${dateRange.date_from}_${dateRange.date_to}`;
    try {
      setLoading(true);
      if (navigator.onLine) {
        const result = await fetchProfitLoss(dateRange);
        setData(result);
        await bulkUpsert('accounting', [{ id: cacheKey, data: result, updated_at: new Date().toISOString() }]);
      } else {
        const cached = await getAll('accounting');
        const entry = cached.find(r => r.id === cacheKey) || cached.find(r => r.id?.startsWith('pl_'));
        setData(entry?.data || null);
      }
    } catch (error) {
      console.error('Failed to load P&L data:', error);
      try {
        const cached = await getAll('accounting');
        const entry = cached.find(r => r.id === cacheKey) || cached.find(r => r.id?.startsWith('pl_'));
        setData(entry?.data || null);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePeriodChange = (type) => {
    setPeriodType(type);
    const today = new Date();
    let from, to = today;

    switch (type) {
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        from = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'year':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setDateRange({
      date_from: from.toISOString().split('T')[0],
      date_to: to.toISOString().split('T')[0],
    });
  };

  const exportToPDF = () => {
    toast.info('PDF export functionality would be implemented here');
  };

  const exportToExcel = () => {
    toast.info('Excel export functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Loading profit & loss data...</p>
      </div>
    );
  }

  const profitMargin = data?.profit_margin || 0;
  const netProfit = data?.net_profit || 0;
  const totalRevenue = data?.total_revenue || 0;
  const totalExpenses = data?.total_expenses || 0;

  // Prepare chart data
  const categoryData = data?.expense_breakdown?.map(item => ({
    category: item.category || 'Uncategorized',
    amount: parseFloat(item.total),
  })) || [];

  const comparisonData = [
    { name: 'Revenue', amount: parseFloat(totalRevenue) },
    { name: 'Expenses', amount: parseFloat(totalExpenses) },
    { name: 'Net Profit', amount: parseFloat(netProfit) },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profit & Loss Statement</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Income statement for your business</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handlePeriodChange('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  periodType === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handlePeriodChange('quarter')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  periodType === 'quarter' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                This Quarter
              </button>
              <button
                onClick={() => handlePeriodChange('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  periodType === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                This Year
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateRange.date_from}
                onChange={(e) => {
                  setPeriodType('custom');
                  setDateRange({ ...dateRange, date_from: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-600 dark:text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.date_to}
                onChange={(e) => {
                  setPeriodType('custom');
                  setDateRange({ ...dateRange, date_to: e.target.value });
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">{fmt(parseFloat(totalRevenue).toFixed(2))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600">{fmt(parseFloat(totalExpenses).toFixed(2))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Net Profit</p>
            <p className={`text-3xl font-bold ${parseFloat(netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(parseFloat(netProfit).toFixed(2))}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Profit Margin</p>
            <p className={`text-3xl font-bold ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(profitMargin).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses Comparison */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue vs Expenses vs Net Profit</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="name" stroke={chartTheme.axisColor} />
                <YAxis stroke={chartTheme.axisColor} />
                <Tooltip formatter={(value) => fmt(parseFloat(value).toFixed(2))} />
                <Bar dataKey="amount" fill={chartTheme.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis type="number" stroke={chartTheme.axisColor} />
                  <YAxis dataKey="category" type="category" width={100} stroke={chartTheme.axisColor} />
                  <Tooltip formatter={(value) => fmt(parseFloat(value).toFixed(2))} />
                  <Bar dataKey="amount" fill={chartTheme.secondary} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-12">No expense data available</p>
            )}
          </div>
        </div>

        {/* Detailed Statement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Statement</h3>
          </div>
          <div className="p-6">
            {/* Revenue Section */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Revenue</h4>
              <div className="pl-4 space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300">Total Revenue (from Orders)</span>
                  <span className="font-semibold text-green-600">{fmt(parseFloat(totalRevenue).toFixed(2))}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Expenses</h4>
              <div className="pl-4 space-y-2">
                {data?.expense_breakdown && data.expense_breakdown.length > 0 ? (
                  data.expense_breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">{item.category || 'Uncategorized'}</span>
                      <span className="font-semibold text-red-600">{fmt(parseFloat(item.total).toFixed(2))}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 py-2">No expenses recorded</div>
                )}
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <span className="text-gray-900 dark:text-white">Total Expenses</span>
                  <span className="text-red-600">{fmt(parseFloat(totalExpenses).toFixed(2))}</span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-4 border-t-2 border-gray-400 dark:border-gray-600">
              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Net Profit / (Loss)</span>
                <span className={`text-2xl font-bold ${parseFloat(netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(parseFloat(netProfit).toFixed(2))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-md font-semibold text-gray-700 dark:text-gray-300">Profit Margin</span>
                <span className={`text-lg font-bold ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(profitMargin).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
