import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, ExclamationTriangleIcon, TrashIcon, PencilIcon, 
  DocumentArrowDownIcon, MagnifyingGlassIcon, FunnelIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, BellIcon,
  ChartBarIcon, ArrowPathIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { fetchTaxes, fetchTaxSummary, createTax, updateTax, deleteTax } from '../../api/accounting';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '../../context/ToastContext';

export default function TaxesEnhanced() {
  const toast = useToast();
  const [taxes, setTaxes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards', 'dashboard'
  const [filters, setFilters] = useState({
    tax_type: '',
    category: '',
    status: '',
    date_from: '',
    date_to: '',
    is_active: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [taxesData, summaryData] = await Promise.all([
        fetchTaxes(filters),
        fetchTaxSummary(),
      ]);
      setTaxes(taxesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load taxes:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddTax = async (formData) => {
    try {
      await createTax(formData);
      setShowAddModal(false);
      loadData();
      toast.success('Tax added successfully!');
    } catch (error) {
      console.error('Failed to add tax:', error);
      toast.error('Failed to add tax');
    }
  };

  const handleUpdateTax = async (formData) => {
    try {
      await updateTax(editingTax.id, formData);
      setEditingTax(null);
      setShowAddModal(false);
      loadData();
      toast.success('Tax updated successfully!');
    } catch (error) {
      console.error('Failed to update tax:', error);
      toast.error('Failed to update tax');
    }
  };

  const handleDeleteTax = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tax record?')) return;
    try {
      await deleteTax(id);
      loadData();
      toast.success('Tax deleted successfully!');
    } catch (error) {
      console.error('Failed to delete tax:', error);
      toast.error('Failed to delete tax');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedTaxes.length === 0) {
      toast.warning('Please select taxes first');
      return;
    }
    
    if (!window.confirm(`${action} ${selectedTaxes.length} tax(es)?`)) return;
    
    try {
      for (const taxId of selectedTaxes) {
        if (action === 'delete') {
          await deleteTax(taxId);
        } else if (action === 'activate' || action === 'deactivate') {
          const tax = taxes.find(t => t.id === taxId);
          await updateTax(taxId, { ...tax, status: action === 'activate' ? 'active' : 'inactive' });
        }
      }
      setSelectedTaxes([]);
      loadData();
      toast.success('Bulk action completed successfully!');
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed');
    }
  };

  const handleExport = (format) => {
    if (format === 'csv') {
      const headers = ['Tax Name', 'Code', 'Type', 'Rate', 'Status', 'Amount', 'Due Date', 'Category'];
      const rows = filteredTaxes.map(tax => [
        tax.name || tax.tax_type_display,
        tax.code || '',
        tax.tax_type_display,
        tax.rate + '%',
        tax.status,
        tax.amount,
        tax.due_date,
        tax.category_display || ''
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taxes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      paid: 'bg-blue-100 text-blue-800 border-blue-200',
      due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      filed: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircleIcon className="w-4 h-4" />,
      inactive: <XCircleIcon className="w-4 h-4" />,
      due: <ClockIcon className="w-4 h-4" />,
      overdue: <ExclamationTriangleIcon className="w-4 h-4" />,
      paid: <CheckCircleIcon className="w-4 h-4" />,
    };
    return icons[status] || <ClockIcon className="w-4 h-4" />;
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  const upcomingTaxes = taxes.filter(tax => {
    if (tax.status === 'paid') return false;
    const daysUntilDue = Math.ceil((new Date(tax.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30 && daysUntilDue >= 0;
  });

  // Filter taxes based on search term
  const filteredTaxes = taxes.filter(tax => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (tax.name && tax.name.toLowerCase().includes(searchLower)) ||
      (tax.code && tax.code.toLowerCase().includes(searchLower)) ||
      (tax.tax_type_display && tax.tax_type_display.toLowerCase().includes(searchLower)) ||
      (tax.notes && tax.notes.toLowerCase().includes(searchLower))
    );
  });

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Enhanced Page Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Tax Management System
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Comprehensive tax tracking, compliance, and reporting
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                <ChartBarIcon className="w-5 h-5 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                Table
              </button>
              <button
                onClick={() => {
                  setEditingTax(null);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add Tax
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard View */}
        {viewMode === 'dashboard' && summary && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Due</p>
                    <p className="text-3xl font-bold mt-2">${parseFloat(summary.total_due || 0).toFixed(2)}</p>
                    <p className="text-orange-100 text-xs mt-1">Pending payment</p>
                  </div>
                  <ClockIcon className="w-12 h-12 text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Paid</p>
                    <p className="text-3xl font-bold mt-2">${parseFloat(summary.total_paid || 0).toFixed(2)}</p>
                    <p className="text-green-100 text-xs mt-1">Completed payments</p>
                  </div>
                  <CheckCircleIcon className="w-12 h-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Overdue</p>
                    <p className="text-3xl font-bold mt-2">{summary.overdue_count || 0}</p>
                    <p className="text-red-100 text-xs mt-1">Requires attention</p>
                  </div>
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Upcoming (30d)</p>
                    <p className="text-3xl font-bold mt-2">{upcomingTaxes.length}</p>
                    <p className="text-blue-100 text-xs mt-1">Due within a month</p>
                  </div>
                  <BellIcon className="w-12 h-12 text-blue-200" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tax Breakdown by Type */}
              {summary?.by_type && summary.by_type.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tax Breakdown by Type</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={summary.by_type.map(item => ({
                          name: item.tax_type.replace('_', ' ').toUpperCase(),
                          value: parseFloat(item.total)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {summary.by_type.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tax Status Overview */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tax Status Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { status: 'Active', count: taxes.filter(t => t.status === 'active').length },
                    { status: 'Due', count: taxes.filter(t => t.status === 'due').length },
                    { status: 'Paid', count: taxes.filter(t => t.status === 'paid').length },
                    { status: 'Overdue', count: taxes.filter(t => t.status === 'overdue').length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Taxes Alert */}
            {upcomingTaxes.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 border-l-4 border-yellow-400 p-6 rounded-lg shadow-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mt-1" />
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">Upcoming Tax Deadlines</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      {upcomingTaxes.length} tax filing(s) due within 30 days
                    </p>
                    <div className="mt-4 space-y-2">
                      {upcomingTaxes.slice(0, 5).map(tax => {
                        const daysUntil = Math.ceil((new Date(tax.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={tax.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {tax.name || tax.tax_type_display}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ${parseFloat(tax.amount).toFixed(2)} - Due: {tax.due_date}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              daysUntil <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <>
            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, code, type, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={filters.tax_type}
                    onChange={(e) => setFilters({ ...filters, tax_type: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="vat">VAT</option>
                    <option value="income_tax">Income Tax</option>
                    <option value="payroll_tax">Payroll Tax</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="property_tax">Property Tax</option>
                    <option value="withholding_tax">Withholding Tax</option>
                  </select>

                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    <option value="direct">Direct Tax</option>
                    <option value="indirect">Indirect Tax</option>
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paid">Paid</option>
                    <option value="due">Due</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedTaxes.length > 0 && (
                <div className="mt-4 flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {selectedTaxes.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Taxes Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTaxes.length === filteredTaxes.length && filteredTaxes.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaxes(filteredTaxes.map(t => t.id));
                            } else {
                              setSelectedTaxes([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tax Name / Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                          Loading taxes...
                        </td>
                      </tr>
                    ) : filteredTaxes.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center text-gray-500">No taxes found</td>
                      </tr>
                    ) : (
                      filteredTaxes.map((tax) => (
                        <tr 
                          key={tax.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            isOverdue(tax.due_date, tax.status) ? 'bg-red-50 dark:bg-red-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTaxes.includes(tax.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTaxes([...selectedTaxes, tax.id]);
                                } else {
                                  setSelectedTaxes(selectedTaxes.filter(id => id !== tax.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {tax.name || tax.tax_type_display}
                            </div>
                            {tax.code && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{tax.code}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {tax.tax_type_display}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {tax.rate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            ${parseFloat(tax.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 w-fit ${getStatusBadge(tax.status)}`}>
                              {getStatusIcon(tax.status)}
                              {tax.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            {tax.due_date}
                            {isOverdue(tax.due_date, tax.status) && (
                              <ExclamationTriangleIcon className="w-4 h-4 inline ml-2 text-red-600" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                            <span className={`px-2 py-1 text-xs rounded ${
                              tax.category === 'direct' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {tax.category_display || tax.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingTax(tax);
                                  setShowAddModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                                title="Edit"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTax(tax.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Add/Edit Tax Modal */}
        {showAddModal && (
          <TaxModal
            tax={editingTax}
            onClose={() => {
              setShowAddModal(false);
              setEditingTax(null);
            }}
            onSave={editingTax ? handleUpdateTax : handleAddTax}
          />
        )}
      </div>
    </div>
  );
}

function TaxModal({ tax, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: tax?.name || '',
    code: tax?.code || '',
    tax_type: tax?.tax_type || 'vat',
    category: tax?.category || 'indirect',
    rate: tax?.rate || '0',
    amount: tax?.amount || '',
    due_date: tax?.due_date || '',
    paid_date: tax?.paid_date || '',
    status: tax?.status || 'active',
    period_start: tax?.period_start || '',
    period_end: tax?.period_end || '',
    effective_date: tax?.effective_date || '',
    expiry_date: tax?.expiry_date || '',
    apply_to_products: tax?.apply_to_products ?? true,
    apply_to_services: tax?.apply_to_services ?? true,
    is_mandatory: tax?.is_mandatory ?? true,
    is_compound: tax?.is_compound ?? false,
    description: tax?.description || '',
    notes: tax?.notes || '',
    filing_reminder_days: tax?.filing_reminder_days || '7',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-2xl font-bold">{tax ? 'Edit Tax' : 'Add New Tax'}</h2>
          <p className="text-purple-100 text-sm mt-1">Configure tax details and application rules</p>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} id="tax-form" className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Name * <span className="text-xs text-gray-500">(e.g., VAT Standard Rate)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter tax name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Code <span className="text-xs text-gray-500">(e.g., VAT-18%)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter tax code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Type *</label>
                  <select
                    required
                    value={formData.tax_type}
                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="vat">VAT</option>
                    <option value="income_tax">Income Tax</option>
                    <option value="payroll_tax">Payroll Tax</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="property_tax">Property Tax</option>
                    <option value="withholding_tax">Withholding Tax</option>
                    <option value="excise_duty">Excise Duty</option>
                    <option value="import_duty">Import Duty</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="direct">Direct Tax (Income Tax, etc.)</option>
                    <option value="indirect">Indirect Tax (VAT, Sales Tax, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="18.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="due">Due</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="filed">Filed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paid Date</label>
                  <input
                    type="date"
                    value={formData.paid_date}
                    onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder (days before due)
                  </label>
                  <input
                    type="number"
                    value={formData.filing_reminder_days}
                    onChange={(e) => setFormData({ ...formData, filing_reminder_days: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Period & Validity */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Period & Validity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Application Scope */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Scope</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.apply_to_products}
                    onChange={(e) => setFormData({ ...formData, apply_to_products: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Apply to Products</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.apply_to_services}
                    onChange={(e) => setFormData({ ...formData, apply_to_services: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Apply to Services</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_mandatory}
                    onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mandatory Tax</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_compound}
                    onChange={(e) => setFormData({ ...formData, is_compound: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Compound/Multi-tier Tax</span>
                </label>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Detailed explanation of this tax"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Additional notes or comments"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tax-form"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              {tax ? 'Update' : 'Create'} Tax
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
