import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { Plus, Edit, Trash2, Upload, Save, X, Eye, Monitor, Smartphone } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../services/productAPI';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, getCurrencyCode } from '../utils/pricingHelpers';

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
    status: 'active'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const currencyCode = getCurrencyCode(pricingSettings);

  // Load products from backend
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts({ userView: true });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setShowDropdown(false);
    } else {
      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = products.filter(product => {
        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower);
        const categoryMatch = product.category && product.category.toLowerCase().includes(searchLower);
        const statusMatch = product.status && product.status.toLowerCase().includes(searchLower);
        const skuMatch = product.sku && product.sku.toLowerCase().includes(searchLower);
        return nameMatch || categoryMatch || statusMatch || skuMatch;
      });
      setFilteredProducts(filtered.slice(0, 50));
      setShowDropdown(true);
    }
  }, [searchTerm, products]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', formData.price);
      payload.append('category', formData.category);
      payload.append('stock', formData.stock);
      payload.append('status', formData.status);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      loadProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      stock: '',
      status: 'active'
    });
    setImageFile(null);
    setImagePreview('');
    setShowAddForm(false);
    setEditingProduct(null);
  };

  // Handle edit
  const handleEdit = (product) => {
    setFormData(product);
    setEditingProduct(product);
    setImageFile(null);
    setImagePreview(product.image || '');
    setShowAddForm(true);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:brightness-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
        {/* Search Input */}
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm && setShowDropdown(true)}
            placeholder="Search products by name, category, SKU..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setShowDropdown(false); }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <img
                      src={product.image || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={e => { e.target.src = '/placeholder-product.png'; }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{product.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {product.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}{product.sku && ` • SKU: ${product.sku}`}</p>
                      <div className="flex gap-4 mt-1 text-sm items-center">
                        <span className="text-green-600 font-medium">{fmt(parseFloat(product.price || 0))}</span>
                        <span className="text-gray-600 font-medium">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No products found matching "{searchTerm}"</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price ({currencyCode})
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </label>
                  {(imagePreview || formData.image) && (
                    <img
                      src={imagePreview || formData.image}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => { e.target.src = '/placeholder-product.png'; }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:brightness-90 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {editingProduct ? 'Update' : 'Save'} Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-200 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mobile
                </button>
                <button onClick={() => setShowPreview(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="p-6 flex justify-center bg-gray-50 dark:bg-gray-800">
              {previewMode === 'desktop' ? (
                /* Desktop Card */
                <div className="w-full max-w-sm bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-600">
                  <div className="relative h-52 bg-gray-100 dark:bg-gray-600">
                    {(imagePreview || formData.image) ? (
                      <img src={imagePreview || formData.image} alt={formData.name || 'Product'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                    )}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      formData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>{formData.status || 'active'}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">{formData.category || 'Category'}</p>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1 truncate">{formData.name || 'Product Name'}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 mb-3">{formData.description || 'Product description will appear here.'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600">{formData.price ? fmt(parseFloat(formData.price)) : fmt(0)}</span>
                      <span className="text-xs text-gray-400">Stock: {formData.stock || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Card — narrow phone frame */
                <div className="w-72 bg-white dark:bg-gray-700 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <div className="relative h-44 bg-gray-100 dark:bg-gray-600">
                    {(imagePreview || formData.image) ? (
                      <img src={imagePreview || formData.image} alt={formData.name || 'Product'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      formData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>{formData.status || 'active'}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-0.5">{formData.category || 'Category'}</p>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">{formData.name || 'Product Name'}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-300 line-clamp-2 mb-2">{formData.description || 'Product description will appear here.'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-indigo-600">{formData.price ? fmt(parseFloat(formData.price)) : fmt(0)}</span>
                      <span className="text-xs text-gray-400">Stock: {formData.stock || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 text-right">
              <button onClick={() => setShowPreview(false)} className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No products found. Add your first product to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{fmt(parseFloat(product.price || 0))}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}