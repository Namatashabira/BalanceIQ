import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { PlusIcon, ExclamationTriangleIcon, TrashIcon, PencilIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { fetchTaxes, fetchTaxSummary, createTax, updateTax, deleteTax } from '../../api/accounting';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/pricingHelpers';

export default function Taxes() {
  const toast = useToast();
  const [taxes, setTaxes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [filters, setFilters] = useState({
    tax_type: '',
    status: '',
    date_from: '',
    date_to: '',
  });
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);

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

  const getStatusBadge = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Taxes</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tax obligations and filings</p>
            </div>
            <button
              onClick={() => {
                setEditingTax(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Tax
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Due</p>
              <p className="text-3xl font-bold text-orange-600">{fmt(parseFloat(summary.total_due || 0))}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Paid</p>
              <p className="text-3xl font-bold text-green-600">{fmt(parseFloat(summary.total_paid || 0))}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Overdue Taxes</p>
              <p className="text-3xl font-bold text-red-600">{summary.overdue_count || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Upcoming (30 days)</p>
              <p className="text-3xl font-bold text-blue-600">{upcomingTaxes.length}</p>
            </div>
          </div>
        )}

      {/* Upcoming Taxes Alert */}
      {upcomingTaxes.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Upcoming Tax Deadlines</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {upcomingTaxes.slice(0, 3).map(tax => (
                    <li key={tax.id}>
                      {tax.tax_type_display} - {fmt(parseFloat(tax.amount))} due on {tax.due_date}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Breakdown by Type */}
      {summary?.by_type && summary.by_type.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tax Breakdown by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {summary.by_type.map((item) => (
              <div key={item.tax_type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{item.tax_type.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(parseFloat(item.total))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filters.tax_type}
            onChange={(e) => setFilters({ ...filters, tax_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="vat">VAT</option>
            <option value="income_tax">Income Tax</option>
            <option value="payroll_tax">Payroll Tax</option>
            <option value="sales_tax">Sales Tax</option>
            <option value="property_tax">Property Tax</option>
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
      </div>

      {/* Taxes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No taxes found</td>
                </tr>
              ) : (
                taxes.map((tax) => (
                  <tr 
                    key={tax.id} 
                    className={`hover:bg-gray-50 ${isOverdue(tax.due_date, tax.status) ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tax.tax_type_display}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {fmt(parseFloat(tax.amount))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tax.due_date}
                      {isOverdue(tax.due_date, tax.status) && (
                        <ExclamationTriangleIcon className="w-4 h-4 inline ml-2 text-red-600" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax.paid_date || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(tax.status)}`}>
                        {tax.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tax.period_start} to {tax.period_end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTax(tax);
                            setShowAddModal(true);
                          }}
                          className="text-primary hover:text-primary/80"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTax(tax.id)}
                          className="text-red-600 hover:text-red-800"
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
    tax_type: tax?.tax_type || 'vat',
    amount: tax?.amount || '',
    due_date: tax?.due_date || '',
    paid_date: tax?.paid_date || '',
    status: tax?.status || 'pending',
    period_start: tax?.period_start || '',
    period_end: tax?.period_end || '',
    notes: tax?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900 dark:to-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-purple-200 dark:border-purple-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tax ? 'Edit Tax' : 'Add Tax'}</h2>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} id="tax-form" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          </form>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="tax-form"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {tax ? 'Update' : 'Add'} Tax
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
