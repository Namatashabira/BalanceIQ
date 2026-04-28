import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  FileCheck, 
  TrendingUp, 
  Scale,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  fetchExpenseSummary,
  fetchPaymentSummary,
  fetchTaxSummary,
  fetchProfitLoss,
  fetchBalanceSheet
} from '../../api/accounting';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';

// Avoid UI blink: only replace summaries when something actually changes
const summariesChanged = (prev, next) => {
  if (!prev) return true;
  const keys = ['expenses', 'payments', 'taxes', 'profitLoss', 'balanceSheet'];
  return keys.some((key) => JSON.stringify(prev[key]) !== JSON.stringify(next[key]));
};

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState(null);
  const [summaries, setSummaries] = useState({
    expenses: null,
    payments: null,
    taxes: null,
    profitLoss: null,
    balanceSheet: null
  });
  const { pricingSettings } = useConfig();
  const fmt = (value) => formatCurrency(value, pricingSettings);
  const refreshIntervalRef = useRef(null);

  const loadSummaries = useCallback(async () => {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      console.log('Fetching accounting summaries...');
      
      const [expenses, payments, taxes, profitLoss, balanceSheet] = await Promise.all([
        fetchExpenseSummary().catch(err => {
          console.error('Expenses error:', err);
          return null;
        }),
        fetchPaymentSummary().catch(err => {
          console.error('Payments error:', err);
          return null;
        }),
        fetchTaxSummary().catch(err => {
          console.error('Taxes error:', err);
          return null;
        }),
        fetchProfitLoss({
          date_from: startOfMonth.toISOString().split('T')[0],
          date_to: endOfMonth.toISOString().split('T')[0]
        }).catch(err => {
          console.error('Profit/Loss error:', err);
          return null;
        }),
        fetchBalanceSheet().catch(err => {
          console.error('Balance Sheet error:', err);
          return null;
        })
      ]);

      console.log('API Responses:', { expenses, payments, taxes, profitLoss, balanceSheet });

      const nextSummaries = {
        expenses,
        payments,
        taxes,
        profitLoss,
        balanceSheet
      };

      setSummaries((prev) => (summariesChanged(prev, nextSummaries) ? nextSummaries : prev));
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    } catch (error) {
      console.error('Error loading summaries:', error);
      setError(error.message || 'Failed to load accounting data');
    } finally {
      if (!hasLoadedOnce) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [hasLoadedOnce]);

  useEffect(() => {
    loadSummaries();
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    refreshIntervalRef.current = setInterval(() => {
      loadSummaries();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadSummaries]);

  const cards = [
    {
      id: 'expenses',
      title: 'Expenses',
      icon: DollarSign,
      description: 'Track and manage business expenses',
      path: '/accounting/expenses',
      color: 'blue',
      getStat: () => {
        if (!summaries.expenses) return 'No data';
        // Backend returns total_expenses from summary endpoint
        const total = summaries.expenses.total_expenses || 0;
        return `${fmt(total)} total`;
      },
      getIndicator: () => {
        if (!summaries.expenses) return null;
        // Count categories from by_category array
        const categories = summaries.expenses.by_category?.length || 0;
        return `${categories} categories`;
      }
    },
    {
      id: 'payments',
      title: 'Payments',
      icon: CreditCard,
      description: 'Monitor income and expense payments',
      path: '/accounting/payments',
      color: 'green',
      getStat: () => {
        if (!summaries.payments) return 'No data';
          const pending = summaries.payments.pending_count || 0;
          const overdue = summaries.payments.overdue_count || 0;
          if (overdue > 0) return `${overdue} overdue`;
          if (pending > 0) return `${pending} pending`;
          return 'All paid';
        },
        getIndicator: () => {
          if (!summaries.payments) return null;
          const income = summaries.payments.total_income || 0;
          const expenses = summaries.payments.total_expenses || 0;
          const net = income - expenses;
          return `Net: ${fmt(net)}`;
        },
        getStatusColor: () => {
          if (!summaries.payments) return 'green';
          const overdue = summaries.payments.overdue_count || 0;
          if (overdue > 0) return 'red';
          return 'green';
        }
      },
      // --- ASSETS CARD INSERTED HERE ---
      {
        id: 'assets',
        title: 'Assets',
        icon: FileCheck, // You can change to another icon if desired
        description: 'Manage and track business assets',
        path: '/accounting/assets',
        color: 'yellow',
        getStat: () => {
          // Placeholder: replace with real summary if backend is connected
          // If you add asset summary to backend, use it here
          return 'View & manage';
        },
        getIndicator: () => {
          // Placeholder: could show count, value, or status
          return null;
        },
        getStatusColor: () => 'yellow',
      },
      // --- END ASSETS CARD ---
      {
        id: 'taxes',
        title: 'Taxes',
        icon: FileCheck,
        description: 'Manage tax obligations and deadlines',
        path: '/accounting/taxes',
        color: 'purple',
        getStat: () => {
          if (!summaries.taxes) return 'No data';
          const upcoming = summaries.taxes.upcoming || [];
          const overdue = upcoming.filter(t => new Date(t.due_date) < new Date());
        
          if (overdue.length > 0) return `${overdue.length} overdue`;
          if (upcoming.length > 0) {
            const nextDue = upcoming[0];
            const daysUntil = Math.ceil(
              (new Date(nextDue.due_date) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return `Due in ${daysUntil} days`;
          }
          return 'No upcoming';
        },
        getIndicator: () => {
          if (!summaries.taxes) return null;
          const totalDue = summaries.taxes.total_due || 0;
          return `${fmt(totalDue)} due`;
        },
        getStatusColor: () => {
          if (!summaries.taxes) return 'purple';
          const upcoming = summaries.taxes.upcoming || [];
          const overdue = upcoming.filter(t => new Date(t.due_date) < new Date());
          if (overdue.length > 0) return 'red';
        
          const nearDue = upcoming.filter(t => {
            const daysUntil = (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24);
            return daysUntil <= 7;
          });
          if (nearDue.length > 0) return 'yellow';
          return 'purple';
        }
      },
    {
      id: 'profit-loss',
      title: 'Profit & Loss',
      icon: TrendingUp,
      description: 'View income statement and profitability',
      path: '/accounting/profit-loss',
      color: 'indigo',
      getStat: () => {
        if (!summaries.profitLoss) return 'No data';
        const netProfit = summaries.profitLoss.net_profit || 0;
        return `${fmt(Math.round(netProfit))} net profit`;
      },
      getIndicator: () => {
        if (!summaries.profitLoss) return null;
        const margin = summaries.profitLoss.profit_margin || 0;
        return `${margin.toFixed(1)}% margin`;
      },
      getStatusColor: () => {
        if (!summaries.profitLoss) return 'indigo';
        const netProfit = summaries.profitLoss.net_profit || 0;
        return netProfit >= 0 ? 'green' : 'red';
      }
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      icon: Scale,
      description: 'View financial position and assets',
      path: '/accounting/balance-sheet',
      color: 'cyan',
      getStat: () => {
        if (!summaries.balanceSheet) return 'Loading...';
        const assets = summaries.balanceSheet.total_assets || 0;
        return `${fmt(assets)} assets`;
      },
      getIndicator: () => {
        if (!summaries.balanceSheet) return null;
        const assets = summaries.balanceSheet.total_assets || 0;
        const liabilities = summaries.balanceSheet.total_liabilities || 0;
        const equity = summaries.balanceSheet.total_equity || 0;
        const balanced = Math.abs(assets - (liabilities + equity)) < 0.01;
        return balanced ? 'Balanced ✓' : 'Unbalanced';
      },
      getStatusColor: () => {
        if (!summaries.balanceSheet) return 'cyan';
        const assets = summaries.balanceSheet.total_assets || 0;
        const liabilities = summaries.balanceSheet.total_liabilities || 0;
        const equity = summaries.balanceSheet.total_equity || 0;
        const balanced = Math.abs(assets - (liabilities + equity)) < 0.01;
        return balanced ? 'green' : 'red';
      }
    }
  ];

  const getColorClasses = (color, statusColor) => {
    const effectiveColor = statusColor || color;
    
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        hover: 'hover:border-blue-400 hover:shadow-blue-100',
        stat: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600',
        hover: 'hover:border-green-400 hover:shadow-green-100',
        stat: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        hover: 'hover:border-purple-400 hover:shadow-purple-100',
        stat: 'text-purple-600'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        icon: 'bg-indigo-100 text-indigo-600',
        hover: 'hover:border-indigo-400 hover:shadow-indigo-100',
        stat: 'text-indigo-600'
      },
      cyan: {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        icon: 'bg-cyan-100 text-cyan-600',
        hover: 'hover:border-cyan-400 hover:shadow-cyan-100',
        stat: 'text-cyan-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-600',
        hover: 'hover:border-red-400 hover:shadow-red-100',
        stat: 'text-red-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'bg-yellow-100 text-yellow-600',
        hover: 'hover:border-yellow-400 hover:shadow-yellow-100',
        stat: 'text-yellow-600'
      }
    };

    return colorMap[effectiveColor] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <div className="text-gray-500 ml-3">Loading accounting overview...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Accounting</h1>
          <p className="text-gray-600">
            Manage your financial records, track expenses, and monitor profitability
          </p>
        </div>
        <button
          onClick={loadSummaries}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading || isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Data</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={loadSummaries}
              className="mt-2 text-sm text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const statusColor = card.getStatusColor ? card.getStatusColor() : card.color;
          const colors = getColorClasses(card.color, statusColor);
          
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className={`
                ${colors.bg} ${colors.border} ${colors.hover}
                border-2 rounded-lg p-6 cursor-pointer
                transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                group
              `}
            >
              {/* Icon and Title */}
              <div className="flex items-start justify-between mb-4">
                <div className={`${colors.icon} p-3 rounded-lg`}>
                  <Icon size={24} />
                </div>
                <ArrowRight 
                  className="text-gray-400 group-hover:text-gray-600 transition-colors" 
                  size={20} 
                />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">
                {card.description}
              </p>

              {/* Main Stat */}
              <div className={`text-2xl font-bold ${colors.stat} mb-2`}>
                {card.getStat()}
              </div>

              {/* Indicator */}
              {card.getIndicator && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {statusColor === 'green' && <CheckCircle size={16} className="text-green-500" />}
                  {statusColor === 'red' && <AlertCircle size={16} className="text-red-500" />}
                  {statusColor === 'yellow' && <AlertCircle size={16} className="text-yellow-500" />}
                  <span>{card.getIndicator()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions or Summary Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Summary */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Revenue</span>
              <span className="font-semibold text-green-600">
                ${(summaries.profitLoss?.revenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="font-semibold text-red-600">
                ${(summaries.profitLoss?.total_expenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-800 font-semibold">Net Profit</span>
              <span className={`font-bold ${
                (summaries.profitLoss?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${(summaries.profitLoss?.net_profit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Health */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Assets</span>
              <span className="font-semibold text-blue-600">
                ${(summaries.balanceSheet?.total_assets || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Liabilities</span>
              <span className="font-semibold text-red-600">
                ${(summaries.balanceSheet?.total_liabilities || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-gray-800 font-semibold">Equity</span>
              <span className="font-bold text-green-600">
                ${(summaries.balanceSheet?.total_equity || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alerts</h3>
          <div className="space-y-3">
            {summaries.payments?.overdue_count > 0 && (
              <div className="flex items-start gap-2 text-red-600">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {summaries.payments.overdue_count} overdue payment{summaries.payments.overdue_count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {summaries.taxes?.upcoming?.filter(t => new Date(t.due_date) < new Date()).length > 0 && (
              <div className="flex items-start gap-2 text-red-600">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {summaries.taxes.upcoming.filter(t => new Date(t.due_date) < new Date()).length} overdue tax obligation{summaries.taxes.upcoming.filter(t => new Date(t.due_date) < new Date()).length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {summaries.taxes?.upcoming?.filter(t => {
              const daysUntil = (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24);
              return daysUntil > 0 && daysUntil <= 7;
            }).length > 0 && (
              <div className="flex items-start gap-2 text-yellow-600">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  Tax payment due within 7 days
                </span>
              </div>
            )}
            {!summaries.payments?.overdue_count && 
             !summaries.taxes?.upcoming?.filter(t => new Date(t.due_date) < new Date()).length &&
             !summaries.taxes?.upcoming?.filter(t => {
               const daysUntil = (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24);
               return daysUntil > 0 && daysUntil <= 7;
             }).length && (
              <div className="flex items-start gap-2 text-green-600">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span className="text-sm">All obligations up to date</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;
