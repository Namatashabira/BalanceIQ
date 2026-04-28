import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  createPayment,
  updatePayment,
  deletePayment,
} from '../../api/accounting';
import { useAccounting } from '../../context/AccountingContext';
import { getChartTheme } from '../../utils/themeUtils';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';
import { useSavingAction } from '../../hooks/useSavingAction';

export default function Payments() {
  const toast = useToast();
  const { payments, paymentSummary: summary, loading, refreshPayments } = useAccounting();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    payment_type: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  const chartTheme = getChartTheme();
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

  useEffect(() => {
    refreshPayments();
  }, [refreshPayments]);

  const handleAddPayment = async (formData) => {
    try {
      console.log('Sending payment data:', formData);
      
      // Validate required fields
      if (!formData.date || !formData.party_name || !formData.amount) {
        toast.warning('Please fill in all required fields (Date, Party Name, Amount)');
        return;
      }
      
      // Prepare payment data with proper types
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Convert empty date strings to null
        due_date: formData.due_date || null,
        paid_date: formData.paid_date || null,
        // Convert empty strings to empty string (not null) for text fields
        reference_number: formData.reference_number || '',
        notes: formData.notes || '',
      };
      
      console.log('Processed payment data:', paymentData);
      await createPayment(paymentData);
      setShowAddModal(false);
      await refreshPayments();
      toast.success('Payment added successfully!');
    } catch (error) {
      console.error('Failed to add payment:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(`Failed to add payment: ${JSON.stringify(error.response?.data || error.message)}`);
      }
    }
  };

  const handleUpdatePayment = async (formData) => {
    try {
      console.log('Updating payment data:', formData);
      
      // Prepare payment data with proper types
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Convert empty date strings to null
        due_date: formData.due_date || null,
        paid_date: formData.paid_date || null,
        // Convert empty strings to empty string (not null) for text fields
        reference_number: formData.reference_number || '',
        notes: formData.notes || '',
      };
      
      await updatePayment(editingPayment.id, paymentData);
      setEditingPayment(null);
      setShowAddModal(false);
      await refreshPayments();
      toast.success('Payment updated successfully!');
    } catch (error) {
      console.error('Failed to update payment:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(`Failed to update payment: ${JSON.stringify(error.response?.data || error.message)}`);
      }
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await deletePayment(id);
      await refreshPayments();
      toast.success('Payment deleted successfully!');
    } catch (error) {
      console.error('Failed to delete payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = [
    { name: 'Income', amount: parseFloat(summary?.total_income || 0) },
    { name: 'Expenses', amount: parseFloat(summary?.total_expenses || 0) },
  ];

  // ===== BUSINESS INTELLIGENCE CALCULATIONS =====
  
  // Cash flow trend data from backend
  const cashFlowTrend = summary?.trend?.map(t => ({
    month: t.month,
    income: parseFloat(t.income || 0),
    expense: parseFloat(t.expense || 0),
    net: parseFloat(t.net || 0),
  })) || [];

  // Calculate cash flow health
  const getCashFlowHealth = () => {
    if (!summary) return { status: 'unknown', message: 'Insufficient data' };
    
    const thisMonthNet = parseFloat(summary.this_month_net || 0);
    const netAmount = parseFloat(summary.net || 0);
    
    if (netAmount < 0 && thisMonthNet < 0) {
      return { 
        status: 'critical', 
        message: 'Negative cash flow',
        color: 'red',
        icon: 'ExclamationTriangleIcon'
      };
    }
    
    if (thisMonthNet < 0 && netAmount > 0) {
      return { 
        status: 'warning', 
        message: 'This month in deficit',
        color: 'orange',
        icon: 'ExclamationTriangleIcon'
      };
    }
    
    if (netAmount > 0 && thisMonthNet > 0) {
      return { 
        status: 'healthy', 
        message: 'Positive cash flow',
        color: 'green',
        icon: 'CheckCircleIcon'
      };
    }
    
    return { 
      status: 'neutral', 
      message: 'Stable position',
      color: 'blue',
      icon: 'CheckCircleIcon'
    };
  };

  // Generate payment insights
  const getPaymentInsights = () => {
    const insights = [];
    if (!summary) return insights;
    
    const overdueCount = summary.total_overdue_count || 0;
    const pendingIncome = parseFloat(summary.pending_income || 0);
    const pendingExpense = parseFloat(summary.pending_expenses || 0);
    const thisMonthNet = parseFloat(summary.this_month_net || 0);
    
    // Insight 1: Overdue payments
    if (overdueCount > 0) {
      insights.push({
        type: 'alert',
        title: `${overdueCount} overdue payment${overdueCount > 1 ? 's' : ''}`,
        description: `You have ${overdueCount} payment(s) past their due date.`,
        action: 'Review and process overdue payments immediately to avoid penalties.',
        iconComponent: 'ExclamationTriangleIcon'
      });
    }
    
    // Insight 2: Large pending amounts
    if (pendingIncome > pendingExpense * 1.5) {
      insights.push({
        type: 'success',
        title: 'Strong incoming cash flow',
        description: `You have ${fmt(pendingIncome)} in pending income.`,
        action: 'Follow up with clients to ensure timely payments.',
        iconComponent: 'ArrowTrendingUpIcon'
      });
    }
    
    // Insight 3: Negative cash flow
    if (thisMonthNet < 0) {
      insights.push({
        type: 'warning',
        title: 'This month shows deficit',
        description: `Current month net is ${fmt(Math.abs(thisMonthNet))} negative.`,
        action: 'Review expenses and accelerate income collection.',
        iconComponent: 'ExclamationTriangleIcon'
      });
    }
    
    // Insight 4: Healthy cash flow
    if (parseFloat(summary.net || 0) > 0 && thisMonthNet > 0 && overdueCount === 0) {
      insights.push({
        type: 'success',
        title: 'Excellent financial health',
        description: 'Positive cash flow with no overdue payments.',
        action: 'Consider investing surplus or building emergency fund.',
        iconComponent: 'CheckCircleIcon'
      });
    }
    
    // Default insight
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Cash flow under control',
        description: 'Your payments are balanced and on track.',
        action: 'Continue monitoring and maintain good payment discipline.',
        iconComponent: 'BanknotesIcon'
      });
    }
    
    return insights;
  };

  // Get contextual hints for payment rows
  const getPaymentHint = (payment) => {
    const hints = [];
    const today = new Date();
    
    // Check if overdue
    if (payment.status === 'pending' && payment.due_date) {
      const dueDate = new Date(payment.due_date);
      if (dueDate < today) {
        hints.push('Overdue payment');
      } else if ((dueDate - today) / (1000 * 60 * 60 * 24) <= 7) {
        hints.push('Due within 7 days');
      }
    }
    
    // Check if large amount
    const avgAmount = parseFloat(summary?.avg_income || summary?.avg_expense || 0);
    if (parseFloat(payment.amount) > avgAmount * 1.5) {
      hints.push('Above average amount');
    }
    
    // Check if recurring (same party appears multiple times)
    const partyCount = payments.filter(p => p.party_name === payment.party_name).length;
    if (partyCount > 2) {
      hints.push('Recurring party');
    }
    
    return hints;
  };

  // Generate natural language summary
  const getNaturalLanguageSummary = () => {
    if (!summary) return '';
    
    const thisMonthNet = parseFloat(summary.this_month_net || 0);
    const overdueCount = summary.total_overdue_count || 0;
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    let text = `In ${currentMonth}, your net cash flow is ${fmt(Math.abs(thisMonthNet))} ${thisMonthNet >= 0 ? 'positive' : 'negative'}.`;
    
    if (overdueCount > 0) {
      text += ` You have ${overdueCount} overdue payment${overdueCount > 1 ? 's' : ''} requiring attention.`;
    } else {
      text += ` All payments are on track with no overdue items.`;
    }
    
    if (summary.trend_direction === 'positive') {
      text += ` Overall trend is positive - keep up the good work.`;
    } else if (summary.trend_direction === 'negative') {
      text += ` Consider reviewing spending patterns to improve cash flow.`;
    }
    
    return text;
  };

  const cashFlowHealth = getCashFlowHealth();
  const paymentInsights = getPaymentInsights();

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track income and expenses</p>
          </div>
          <button
            onClick={() => {
              setEditingPayment(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> Add Payment
          </button>
        </div>

        {/* Cash Flow Health Summary - Business-Friendly */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {fmt(parseFloat(summary.total_income || 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {fmt(parseFloat(summary.total_expenses || 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${
                parseFloat(summary.net || 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {fmt(parseFloat(summary.net || 0))}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {fmt(parseFloat(summary.pending_income || 0))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {summary.income_count || 0} transaction(s)
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {summary.total_overdue_count || 0}
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Requires attention
              </p>
            </div>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Comparison */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
            <ResponsiveContainer height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="name" stroke={chartTheme.axisColor} />
                <YAxis stroke={chartTheme.axisColor} />
                <Tooltip formatter={(value) => fmt(value)} />
                <Bar dataKey="amount" fill={chartTheme.primary} />
              </BarChart>
            </ResponsiveContainer>
            {/* Quick insight below chart */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Cash Flow Status: {cashFlowHealth.message}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Net: {fmt(parseFloat(summary?.net || 0))} | This Month: {fmt(parseFloat(summary?.this_month_net || 0))}
              </p>
            </div>
          </div>

          {/* Cash Flow Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">12-Month Cash Flow Trend</h3>
            <ResponsiveContainer height={300}>
              <LineChart data={cashFlowTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                <XAxis dataKey="month" stroke={chartTheme.axisColor} />
                <YAxis stroke={chartTheme.axisColor} />
                <Tooltip formatter={(value) => fmt(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
              </LineChart>
            </ResponsiveContainer>
            {/* Trend insight */}
            <div className={`mt-4 p-3 rounded-lg border ${
              summary?.trend_direction === 'positive'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : summary?.trend_direction === 'negative'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
            }`}>
              <p className={`text-sm font-semibold ${
                summary?.trend_direction === 'positive'
                  ? 'text-green-900 dark:text-green-300'
                  : summary?.trend_direction === 'negative'
                  ? 'text-red-900 dark:text-red-300'
                  : 'text-gray-900 dark:text-gray-300'
              }`}>
                Trend: {summary?.trend_direction || 'stable'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Insights Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <LightBulbIcon className="w-6 h-6" />
              Payment Insights
            </h3>
            <p className="text-blue-100 text-sm mt-1">Smart recommendations to optimize cash flow</p>
          </div>
          <div className="p-6 space-y-4">
            {paymentInsights.map((insight, idx) => {
              const IconComponent = {
                'ExclamationTriangleIcon': ExclamationTriangleIcon,
                'ArrowTrendingUpIcon': ArrowTrendingUpIcon,
                'CheckCircleIcon': CheckCircleIcon,
                'BanknotesIcon': BanknotesIcon,
              }[insight.iconComponent];
              
              return (
              <div key={idx} className={`group hover:shadow-md transition-all duration-200 rounded-xl border-l-4 ${
                insight.type === 'alert' || insight.type === 'warning'
                  ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-500'
                  : insight.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                  : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
              }`}>
                <div className="flex gap-4 p-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    insight.type === 'alert' || insight.type === 'warning'
                      ? 'bg-orange-100 dark:bg-orange-900/30'
                      : insight.type === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      insight.type === 'alert' || insight.type === 'warning'
                        ? 'text-orange-600 dark:text-orange-400'
                        : insight.type === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base font-bold mb-1.5 ${
                      insight.type === 'alert' || insight.type === 'warning'
                        ? 'text-orange-900 dark:text-orange-300'
                        : insight.type === 'success'
                        ? 'text-green-900 dark:text-green-300'
                        : 'text-blue-900 dark:text-blue-300'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mb-3 leading-relaxed ${
                      insight.type === 'alert' || insight.type === 'warning'
                        ? 'text-orange-700 dark:text-orange-400'
                        : insight.type === 'success'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {insight.description}
                    </p>
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${
                      insight.type === 'alert' || insight.type === 'warning'
                        ? 'bg-orange-100 dark:bg-orange-900/20'
                        : insight.type === 'success'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      <CurrencyDollarIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        insight.type === 'alert' || insight.type === 'warning'
                          ? 'text-orange-700 dark:text-orange-400'
                          : insight.type === 'success'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`} />
                      <p className={`text-xs font-semibold ${
                        insight.type === 'alert' || insight.type === 'warning'
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search party name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
          <select
            value={filters.payment_type}
            onChange={(e) => setFilters({ ...filters, payment_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {['Date','Party Name','Amount','Type','Status','Payment Method','Due Date','Actions'].map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 animate-spin mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Loading payments...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BanknotesIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No payments found
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                          {searchTerm ? 'Try adjusting your search terms or filters' : 'Start tracking your cash flow by recording your first payment'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => {
                              setEditingPayment(null);
                              setShowAddModal(true);
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                          >
                            <PlusIcon className="w-5 h-5" />
                            Record Your First Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const hints = getPaymentHint(payment);
                    return (
                    <tr key={payment.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group relative">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payment.party_name}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={payment.payment_type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {payment.payment_type === 'income' ? '+' : '-'}{fmt(parseFloat(payment.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.payment_type === 'income' ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><ArrowUpIcon className="w-4 h-4" /> Income</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><ArrowDownIcon className="w-4 h-4" /> Expense</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(payment.status)}`}>{payment.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.payment_method?.replace('_', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.due_date || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingPayment(payment); setShowAddModal(true); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Edit payment"><PencilIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleDeletePayment(payment.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300" title="Delete payment"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  );}
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Modal */}
        {showAddModal && (
          <PaymentModal
            payment={editingPayment}
            onClose={() => { setShowAddModal(false); setEditingPayment(null); }}
            onSave={editingPayment ? handleUpdatePayment : handleAddPayment}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- PAYMENT MODAL ---------- */
function PaymentModal({ payment, onClose, onSave }) {
  const { saving, runWithSaving } = useSavingAction({
    successMessage: 'Payment saved successfully!',
    errorLabel: 'saving payment'
  });
  const [formData, setFormData] = useState({
    date: payment?.date || new Date().toISOString().split('T')[0],
    party_name: payment?.party_name || '',
    amount: payment?.amount || '',
    payment_type: payment?.payment_type || 'income',
    status: payment?.status || 'pending',
    payment_method: payment?.payment_method || 'cash',
    reference_number: payment?.reference_number || '',
    due_date: payment?.due_date || '',
    paid_date: payment?.paid_date || '',
    notes: payment?.notes || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await runWithSaving(() => onSave(formData));
    } catch (err) {
      console.error('Error saving payment:', err);
    }
  };

  return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 z-50">
    <div className="
      bg-white dark:bg-gray-900
      rounded-lg shadow-xl
      w-full max-w-lg
      max-h-[85vh]
      flex flex-col overflow-hidden
    ">

      {/* HEADER */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {payment ? 'Edit Payment' : 'Add Payment'}
        </h2>
      </div>

      {/* BODY (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-3">

          {/* Date & Party */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Date *</label>
              <input type="date" required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Party *</label>
              <input type="text" required
                value={formData.party_name}
                onChange={e => setFormData({ ...formData, party_name: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Amount *</label>
              <input type="number" step="0.01" required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Type *</label>
              <select
                value={formData.payment_type}
                onChange={e => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border rounded-md"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          {/* Status & Method */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={formData.payment_method}
              onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <input type="date"
              value={formData.due_date}
              onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            />
            <input type="date"
              value={formData.paid_date}
              onChange={e => setFormData({ ...formData, paid_date: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            />
          </div>

          <input type="text" placeholder="Reference"
            value={formData.reference_number}
            onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />

          <textarea rows={2} placeholder="Notes"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border rounded-md"
          />
        </form>
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="payment-form"
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving...' : payment ? 'Update' : 'Add'}
          </button>
        </div>
      </div>

    </div>
  </div>
);
}