import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, Calendar, XCircle, Plus, Upload, Download, X, Search, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchProducts } from '../services/productAPI';

export default function Inventory() {
  const toast = useToast();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addStockForm, setAddStockForm] = useState({
    product: '',
    batchNumber: '',
    quantity: '',
    manufactureDate: '',
    expiryDate: '',
    supplier: '',
    notes: '',
  });

  // ------------------------------
  // Data fetching (live products)
  // ------------------------------
  const mapProductToInventory = (product) => {
    const today = new Date();
    const expiryDate = product.expiry_date || product.expiryDate || '';
    const manufactureDate = product.manufacture_date || product.manufactureDate || '';
    const stock = Number(product.stock ?? 0);
    const imageUrl = product.image || product.image_url || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '';
    const description = product.short_description || product.shortDescription || product.description || '';

    let status = 'safe';
    if (stock === 0) {
      status = 'out';
    }

    if (expiryDate) {
      const expDate = new Date(expiryDate);
      if (expDate < today) {
        status = 'expired';
      } else if (status !== 'out') {
        const daysToExpiry = (expDate - today) / (1000 * 60 * 60 * 24);
        if (daysToExpiry <= 30) {
          status = 'expiring';
        }
      }
    }

    if (status === 'safe' && stock <= 10) {
      status = 'low';
    }

    return {
      id: product.id,
      productName: product.name,
      batchNumber: product.batch_number || product.batchNumber || 'N/A',
      currentStock: stock,
      expiryDate,
      manufactureDate,
      supplier: product.supplier || 'Not set',
      imageUrl,
      description,
      status,
    };
  };

  const loadInventory = async (showToast = true) => {
    try {
      setIsLoading(true);
      const products = await fetchProducts({ userView: true });
      const mapped = Array.isArray(products) ? products.map(mapProductToInventory) : [];
      setInventory(mapped);
      if (showToast) {
        toast.success('Inventory synced with latest products');
      }
    } catch (error) {
      console.error('Failed to load inventory', error);
      toast.error('Unable to load inventory. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(false);
  }, []);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const lowStockItems = inventory.filter(item => item.currentStock > 0 && item.currentStock <= 10).length;
    const expiringItems = inventory.filter(item => item.status === 'expiring').length;
    const outOfStockItems = inventory.filter(item => item.currentStock === 0).length;
    return {
      totalProducts: inventory.length,
      lowStockItems,
      expiringItems,
      outOfStockItems,
    };
  }, [inventory]);

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expiring':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'out':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'safe':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (item) => {
    if (item.currentStock === 0 || item.status === 'out') return 'Out of Stock';
    if (item.status === 'expired') return 'Expired';
    if (item.status === 'expiring') return 'Expiring Soon';
    if (item.status === 'low') return 'Low Stock';
    return 'In Stock';
  };

  // Handle Add Stock form submission
  const handleAddStock = (e) => {
    e.preventDefault();
    console.log('Adding stock:', addStockForm);
    // Here you would normally send data to backend
    toast.success('Stock added successfully! (This is a demo)');
    setShowAddStockModal(false);
    // Reset form
    setAddStockForm({
      product: '',
      batchNumber: '',
      quantity: '',
      manufactureDate: '',
      expiryDate: '',
      supplier: '',
      notes: '',
    });
  };

  // Handle stock adjustment
  const handleAdjustStock = (itemId) => {
    const item = inventory.find(i => i.id === itemId);
    const newQuantity = prompt(`Adjust stock for "${item.productName}"\nCurrent stock: ${item.currentStock}\n\nEnter new quantity:`);
    
    if (newQuantity !== null && !isNaN(newQuantity)) {
      const qty = parseInt(newQuantity);
      if (qty < item.currentStock) {
        const confirmed = confirm(`You are reducing stock from ${item.currentStock} to ${qty}. Confirm?`);
        if (!confirmed) return;
      }
      
      setInventory(inventory.map(i => 
        i.id === itemId ? { ...i, currentStock: qty } : i
      ));
      toast.success('Stock adjusted successfully!');
    }
  };

  // Handle bulk upload
  const handleBulkUpload = () => {
    toast.info('Bulk upload feature coming soon!');
  };

  // Handle export
  const handleExport = () => {
    toast.info('Exporting inventory data...');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage product stock levels</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => navigate('/product', { state: { openForm: true, source: 'inventory-add-stock', fromInventory: true } })}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
            <button
              onClick={handleBulkUpload}
              className="flex-1 sm:flex-none bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xs:inline">Bulk Upload</span>
              <span className="xs:hidden">Upload</span>
            </button>
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => loadInventory(true)}
              className="flex-1 sm:flex-none bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading && (
          <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            Syncing inventory with latest products...
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{summary.totalProducts}</p>
              </div>
              <div className="hidden sm:flex bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Low Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{summary.lowStockItems}</p>
              </div>
              <div className="hidden sm:flex bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Expiring</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">{summary.expiringItems}</p>
              </div>
              <div className="hidden sm:flex bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Out of Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{summary.outOfStockItems}</p>
              </div>
              <div className="hidden sm:flex bg-red-100 dark:bg-red-900 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name, batch number, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Inventory — Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {filteredInventory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No inventory items found</p>
            </div>
          ) : filteredInventory.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{item.productName}</p>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.supplier}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Stock</p>
                  <p className={`font-semibold ${
                    item.currentStock === 0 ? 'text-red-600' :
                    item.currentStock <= 10 ? 'text-orange-600' : 'text-green-600'
                  }`}>{item.currentStock} units</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Batch</p>
                  <p className="text-gray-900 dark:text-white font-medium truncate">{item.batchNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Expiry</p>
                  <p className="text-gray-900 dark:text-white font-medium">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate('/product', { state: { productId: item.id, openForm: true, source: 'inventory-view', fromInventory: true } })}
                  className="flex-1 text-center text-xs text-blue-600 border border-blue-300 rounded-lg py-1.5 hover:bg-blue-50"
                >
                  View
                </button>
                <button
                  onClick={() => handleAdjustStock(item.id)}
                  className="flex-1 text-center text-xs text-green-600 border border-green-300 rounded-lg py-1.5 hover:bg-green-50"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Inventory Table — Desktop */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => navigate('/product', { state: { productId: item.id, openForm: true, source: 'inventory-row', fromInventory: true } })}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-gray-400 text-xs">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.productName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.supplier}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400" style={{ maxWidth: '240px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.batchNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        item.currentStock === 0 ? 'text-red-600' :
                        item.currentStock <= 10 ? 'text-orange-600' : 'text-green-600'
                      }`}>{item.currentStock} units</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => navigate('/product', { state: { productId: item.id, openForm: true, source: 'inventory-view', fromInventory: true } })} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3">View</button>
                      <button onClick={() => handleAdjustStock(item.id)} className="text-green-600 hover:text-green-800 dark:text-green-400">Adjust Stock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No inventory items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Stock</h2>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={addStockForm.product}
                  onChange={(e) => setAddStockForm({ ...addStockForm, product: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a product</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.productName}>
                      {item.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addStockForm.batchNumber}
                    onChange={(e) => setAddStockForm({ ...addStockForm, batchNumber: e.target.value })}
                    placeholder="e.g., BATCH-2024-005"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={addStockForm.quantity}
                    onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                    placeholder="e.g., 100"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manufacture Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={addStockForm.manufactureDate}
                    onChange={(e) => setAddStockForm({ ...addStockForm, manufactureDate: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={addStockForm.expiryDate}
                    onChange={(e) => setAddStockForm({ ...addStockForm, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addStockForm.supplier}
                  onChange={(e) => setAddStockForm({ ...addStockForm, supplier: e.target.value })}
                  placeholder="e.g., GreenGrow Ltd"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={addStockForm.notes}
                  onChange={(e) => setAddStockForm({ ...addStockForm, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  rows="3"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
