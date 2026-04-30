import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useSavingAction } from '../../hooks/useSavingAction';
import {
  PlusIcon, TrashIcon, PencilIcon, ExclamationTriangleIcon,
  ArrowTrendingUpIcon, CheckCircleIcon, CurrencyDollarIcon,
  BriefcaseIcon, LightBulbIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  fetchExpenses, fetchExpenseSummary, fetchExpenseCategories,
  createExpense, updateExpense, deleteExpense, createExpenseCategory,
} from '../../api/accounting';
import { getChartTheme } from '../../utils/themeUtils';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';
import { getAll, bulkUpsert, enqueue } from '../../services/localStore';

export default function Expenses() {
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, _setFilters] = useState({
    category: '',
    payment_method: '',
    date_from: '',
    date_to: '',
  });

  const chartTheme = getChartTheme();
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  const loadData = useCallback(async () => {
    try {
      if (navigator.onLine) {
        const [expensesData, summaryData, categoriesData] = await Promise.all([
          fetchExpenses(filters),
          fetchExpenseSummary(),
          fetchExpenseCategories(),
        ]);
        setExpenses(expensesData);
        setSummary(summaryData);
        setCategories(categoriesData);
        // Cache
        await bulkUpsert('accounting', [
          { id: 'expenses_list', data: expensesData, updated_at: new Date().toISOString() },
          { id: 'expenses_summary', data: summaryData, updated_at: new Date().toISOString() },
          { id: 'expenses_categories', data: categoriesData, updated_at: new Date().toISOString() },
        ]);
      } else {
        const cached = await getAll('accounting');
        const expensesEntry   = cached.find(r => r.id === 'expenses_list');
        const summaryEntry    = cached.find(r => r.id === 'expenses_summary');
        const categoriesEntry = cached.find(r => r.id === 'expenses_categories');
        if (expensesEntry)   setExpenses(expensesEntry.data);
        if (summaryEntry)    setSummary(summaryEntry.data);
        if (categoriesEntry) setCategories(categoriesEntry.data);
      }
    } catch (err) {
      console.error(err);
      // Fallback to cache
      try {
        const cached = await getAll('accounting');
        const expensesEntry = cached.find(r => r.id === 'expenses_list');
        if (expensesEntry) setExpenses(expensesEntry.data);
      } catch {}
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddExpense = async (data) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { alert('You are not logged in. Please log in first.'); return; }
      if (!navigator.onLine) {
        const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
        await enqueue({ method: 'POST', url: `${API}/accounting/expenses/`, body: data });
        toast.success('Expense saved offline — will sync when reconnected.');
        setShowAddModal(false);
        return;
      }
      await createExpense(data);
      setShowAddModal(false);
      await loadData();
      toast.success('Expense added successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      if (err.response?.status === 401) toast.error('Unauthorized. Please log in again.');
      else toast.error('Failed to add expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateExpense = async (data) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { toast.error('You are not logged in. Please log in first.'); return; }
      if (!navigator.onLine) {
        const API = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';
        await enqueue({ method: 'PATCH', url: `${API}/accounting/expenses/${editingExpense.id}/`, body: data });
        toast.success('Expense update saved offline — will sync when reconnected.');
        setEditingExpense(null); setShowAddModal(false);
        return;
      }
      await updateExpense(editingExpense.id, data);
      setEditingExpense(null); setShowAddModal(false);
      await loadData();
      toast.success('Expense updated successfully!');
    } catch (err) {
      console.error('Error updating expense:', err);
      if (err.response?.status === 401) toast.error('Unauthorized. Please log in again.');
      else toast.error('Failed to update expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      await loadData();
      toast.success('Expense deleted successfully!');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddCategory = async (name, description) => {
    try {
      await createExpenseCategory({ name, description });
      setShowCategoryModal(false);
      const updatedCategories = await fetchExpenseCategories();
      setCategories(updatedCategories);
      toast.success('Category added successfully!');
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error('Failed to add category: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryChartData =
    summary?.by_category?.map((c) => ({
      name: c.category__name || 'Uncategorized',
      value: parseFloat(c.total),
    })) || [];

  const trendChartData =
    summary?.trend?.map((t) => ({
      month: t.month,
      amount: parseFloat(t.total),
    })) || [];

  // ===== BUSINESS INTELLIGENCE CALCULATIONS =====
  
  // Calculate highest category
  const getHighestCategory = () => {
    if (!categoryChartData.length) return { name: 'N/A', value: 0, percentage: 0 };
    const highest = categoryChartData.reduce((max, cat) => 
      cat.value > max.value ? cat : max, categoryChartData[0]
    );
    const percentage = summary?.total_expenses > 0 
      ? (highest.value / summary.total_expenses * 100).toFixed(1) 
      : 0;
    return { ...highest, percentage };
  };

  // Analyze expense trend (last 3 months)
  const getTrendInsight = () => {
    if (!trendChartData || trendChartData.length < 3) return null;
    
    const lastThreeMonths = trendChartData.slice(-3);
    const changes = [];
    
    for (let i = 1; i < lastThreeMonths.length; i++) {
      const prev = lastThreeMonths[i - 1].amount;
      const curr = lastThreeMonths[i].amount;
      if (prev > 0) {
        const changePercent = ((curr - prev) / prev * 100).toFixed(0);
        changes.push({ month: lastThreeMonths[i].month, change: parseFloat(changePercent) });
      }
    }
    
    if (changes.length === 0) return null;
    
    const avgChange = changes.reduce((sum, c) => sum + c.change, 0) / changes.length;
    const biggestChange = changes.reduce((max, c) => 
      Math.abs(c.change) > Math.abs(max.change) ? c : max
    );
    
    return { avgChange, biggestChange };
  };

  // Generate intelligent expense insights
  const getExpenseInsights = () => {
    const insights = [];
    const highestCat = getHighestCategory();
    
    // Insight 1: High category concentration
    if (highestCat.percentage > 35) {
      insights.push({
        type: 'warning',
        title: `${highestCat.name} dominates your spending`,
        description: `This category represents ${highestCat.percentage}% of total expenses.`,
        action: 'Consider diversifying expenses or reviewing this category for savings.',
        iconComponent: 'ExclamationTriangleIcon'
      });
    }
    
    // Insight 2: Trend analysis
    const trend = getTrendInsight();
    if (trend) {
      if (trend.avgChange > 10) {
        insights.push({
          type: 'alert',
          title: 'Expenses are rising',
          description: `Your expenses increased by an average of ${trend.avgChange.toFixed(0)}% over the last 3 months.`,
          action: 'Review recent purchases and identify areas to cut costs.',
          iconComponent: 'ArrowTrendingUpIcon'
        });
      } else if (Math.abs(trend.avgChange) < 5) {
        insights.push({
          type: 'success',
          title: 'Stable expense control',
          description: 'Your expenses have remained consistent over the past 3 months.',
          action: 'Keep up the good work maintaining budget discipline.',
          iconComponent: 'CheckCircleIcon'
        });
      }
    }
    
    // Insight 3: Monthly average vs this month
    if (summary && summary.this_month > summary.avg_per_month * 1.2) {
      insights.push({
        type: 'warning',
        title: 'This month is above average',
        description: `Current spending is ${((summary.this_month / summary.avg_per_month - 1) * 100).toFixed(0)}% higher than your monthly average.`,
        action: 'Review this month\'s expenses to understand the spike.',
        iconComponent: 'CurrencyDollarIcon'
      });
    }
    
    // Default insight if no issues
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Healthy expense pattern',
        description: 'Your expenses are well-distributed and under control.',
        action: 'Continue monitoring to maintain this balance.',
        iconComponent: 'BriefcaseIcon'
      });
    }
    
    return insights;
  };

  // Calculate contextual hints for expense rows
  const getExpenseHint = (expense) => {
    const hints = [];
    const highestCat = getHighestCategory();
    const expenseCategory = categories.find(c => c.id === expense.category);
    
    // Check if part of highest spending category
    if (expenseCategory && expenseCategory.name === highestCat.name) {
      hints.push('Part of top spending category');
    }
    
    // Check if above monthly average
    if (summary?.avg_per_month) {
      const monthlyAvgPerExpense = summary.avg_per_month / (expenses.length || 1);
      if (parseFloat(expense.amount) > monthlyAvgPerExpense) {
        hints.push('Above average expense');
      }
    }
    
    // Check for recurring patterns (same vendor appears multiple times)
    const vendorCount = expenses.filter(e => e.vendor === expense.vendor).length;
    if (vendorCount > 2) {
      hints.push('Recurring expense');
    }
    
    return hints;
  };

  const highestCategory = getHighestCategory();
  const trendInsight = getTrendInsight();
  const expenseInsights = getExpenseInsights();

  // Generate natural language summary
  const getNaturalLanguageSummary = () => {
    if (!summary) return '';

    const highestCat = getHighestCategory();
    const trend = getTrendInsight();

    let summaryText = `In ${new Date().toLocaleString('default', { month: 'long' })}, your top spending category was ${highestCat.name}, accounting for ${highestCat.percentage}% of total expenses.`;

    if (trend) {
      const trendChange = trend.avgChange.toFixed(1);
      if (trend.avgChange > 0) {
        summaryText += ` Overall, expenses increased by ${trendChange}% vs last 3 months.`;
      } else if (trend.avgChange < 0) {
        summaryText += ` Overall, expenses decreased by ${Math.abs(trendChange)}% vs last 3 months.`;
      } else {
        summaryText += ` Overall, expenses remained stable compared to previous months.`;
      }

      summaryText += ` Consider reviewing top vendors for potential savings.`;
    }

    return summaryText;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Expense Health Summary - Business-Friendly Labels */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Total Spending" value={summary.total_expenses} formatter={fmt} />
            <SummaryCard title="This Month" value={summary.this_month} formatter={fmt} />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Highest Category</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white truncate" title={highestCategory.name}>
                {highestCategory.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {highestCategory.percentage}% of total
              </p>
            </div>
            <SummaryCard title="Monthly Average" value={summary.avg_per_month} formatter={fmt} />
          </div>
        )}

        {/* Natural Language Insights */}
        {summary && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              💡 {getNaturalLanguageSummary()}
            </p>
          </div>
        )}

        {/* Charts Section with Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown with Insights */}
          <ChartCard title="Expenses by Category">
            <ResponsiveContainer height={300}>
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" outerRadius={90}>
                  {categoryChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={chartTheme.colors[i % chartTheme.colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            {/* Category Insights */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Top Category: {highestCategory.name}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Represents {highestCategory.percentage}% of your total expenses ({fmt(parseFloat(highestCategory.value))})
              </p>
            </div>
          </ChartCard>

          {/* Trend Chart with Analysis */}
          <ChartCard title="Monthly Expense Trend">
            <ResponsiveContainer height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => fmt(value)} />
                <Line 
                  dataKey="amount" 
                  stroke={chartTheme.primary} 
                  strokeWidth={2}
                  dot={{ fill: chartTheme.primary, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {/* Trend Insight */}
            {trendInsight && (
              <div className={`mt-4 p-3 rounded-lg border ${
                trendInsight.avgChange > 10 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}>
                <p className={`text-sm font-semibold mb-1 ${
                  trendInsight.avgChange > 10
                    ? 'text-orange-900 dark:text-orange-300'
                    : 'text-green-900 dark:text-green-300'
                }`}>
                  {trendInsight.avgChange > 10 ? '📈 Rising Trend' : '📊 Stable Pattern'}
                </p>
                <p className={`text-xs ${
                  trendInsight.avgChange > 10
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  {trendInsight.avgChange > 10
                    ? `Your expenses increased over the last 3 months. The biggest rise was in ${trendInsight.biggestChange.month} (${trendInsight.biggestChange.change > 0 ? '+' : ''}${trendInsight.biggestChange.change}%).`
                    : `Your expenses have remained consistent. Average change: ${trendInsight.avgChange.toFixed(1)}% per month.`
                  }
                </p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Expense Insights Card - Smart Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <LightBulbIcon className="w-6 h-6" />
              Expense Insights
            </h3>
            <p className="text-purple-100 text-sm mt-1">AI-powered recommendations to optimize your spending</p>
          </div>
          <div className="p-6 space-y-4">
            {expenseInsights.map((insight, idx) => {
              // Map icon component name to actual component
              const IconComponent = {
                'ExclamationTriangleIcon': ExclamationTriangleIcon,
                'ArrowTrendingUpIcon': ArrowTrendingUpIcon,
                'CheckCircleIcon': CheckCircleIcon,
                'CurrencyDollarIcon': CurrencyDollarIcon,
                'BriefcaseIcon': BriefcaseIcon,
              }[insight.iconComponent];
              
              return (
              <div key={idx} className={`group hover:shadow-md transition-all duration-200 rounded-xl border-l-4 ${
                insight.type === 'warning' || insight.type === 'alert'
                  ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500'
                  : insight.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
              }`}>
                <div className="flex gap-4 p-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    insight.type === 'warning' || insight.type === 'alert'
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : insight.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      insight.type === 'warning' || insight.type === 'alert'
                        ? 'text-orange-600 dark:text-orange-400'
                        : insight.type === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold mb-1.5 ${
                      insight.type === 'warning' || insight.type === 'alert'
                        ? 'text-orange-900 dark:text-orange-300'
                        : insight.type === 'success'
                        ? 'text-green-900 dark:text-green-300'
                        : 'text-blue-900 dark:text-blue-300'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mb-3 leading-relaxed ${
                      insight.type === 'warning' || insight.type === 'alert'
                        ? 'text-orange-700 dark:text-orange-400'
                        : insight.type === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {insight.description}
                    </p>
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      insight.type === 'warning' || insight.type === 'alert'
                        ? 'bg-orange-100 dark:bg-orange-900/20'
                        : insight.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      <BriefcaseIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        insight.type === 'warning' || insight.type === 'alert'
                          ? 'text-orange-700 dark:text-orange-400'
                          : insight.type === 'success'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`} />
                      <p className={`text-xs font-semibold ${
                        insight.type === 'warning' || insight.type === 'alert'
                          ? 'text-orange-800 dark:text-orange-300'
                          : insight.type === 'success'
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-blue-800 dark:text-blue-300'
                      }`}>
                        <span className="font-bold">Action:</span> {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            placeholder="Search vendor or notes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <BriefcaseIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No expenses found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {searchTerm ? 'Try adjusting your search terms' : 'Start tracking your expenses by adding your first entry'}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => {
                          setEditingExpense(null);
                          setShowAddModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        Add Your First Expense
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => {
                const hints = getExpenseHint(e);
                return (
                <tr 
                  key={e.id} 
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group relative"
                  title={hints.join(' • ')}
                >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{e.date}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {e.vendor}
                  {/* Contextual Hints on Hover */}
                  {hints.length > 0 && (
                    <div className="hidden group-hover:block absolute left-0 mt-1 z-10">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                        {hints.map((hint, idx) => (
                          <div key={idx} className="flex items-center gap-1 mb-1 last:mb-0">
                            <span className="text-yellow-400">•</span>
                            <span>{hint}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {categories.find(c => c.id === e.category)?.name || 'Uncategorized'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{fmt(parseFloat(e.amount))}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingExpense(e);
                      setShowAddModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    title="Edit expense"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteExpense(e.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                    title="Delete expense"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
            })
            )}
          </tbody>
        </table>
        </div>

        {/* Modals */}
        {showAddModal && (
          <ExpenseModal
            expense={editingExpense}
            categories={categories}
            onClose={() => setShowAddModal(false)}
            onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
          />
        )}

        {showCategoryModal && (
          <CategoryModal
            onClose={() => setShowCategoryModal(false)}
            onSave={handleAddCategory}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- MODALS ---------- */

function ExpenseModal({ expense, categories, onClose, onSave }) {
  const toast = useToast();
  const { saving, runWithSaving } = useSavingAction({
    successMessage: 'Expense saved successfully!',
    errorLabel: 'saving expense'
  });
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    category: expense?.category || '',
    vendor: expense?.vendor || '',
    amount: expense?.amount || '',
    payment_method: expense?.payment_method || 'cash',
    notes: expense?.notes || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.date) {
      toast.warning('Please select a date');
      return;
    }
    if (!formData.vendor) {
      toast.warning('Please enter a vendor name');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.warning('Please enter a valid amount');
      return;
    }
    
    try {
      await runWithSaving(() => onSave(formData));
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4"
      >
        <h2 className="text-2xl font-bold">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>

        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border p-2"
        />

        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full border p-2"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Vendor"
          value={formData.vendor}
          onChange={(e) =>
            setFormData({ ...formData, vendor: e.target.value })
          }
          className="w-full border p-2"
        />

        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: e.target.value })
          }
          className="w-full border p-2"
        />

        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          className="w-full border p-2"
        />

        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryModal({ onClose, onSave }) {
  const toast = useToast();
  const { saving, runWithSaving } = useSavingAction({
    successMessage: 'Category saved successfully!',
    errorLabel: 'saving category'
  });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.warning('Please enter a category name');
      return;
    }
    
    try {
      await runWithSaving(() => onSave(name, description));
    } catch (err) {
      console.error('Error in handleSubmit:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold">Add Category</h2>

        <input
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2"
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2"
        />

        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- SMALL HELPERS ---------- */

function SummaryCard({ title, value, formatter = (v) => v }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatter(parseFloat(value || 0))}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
