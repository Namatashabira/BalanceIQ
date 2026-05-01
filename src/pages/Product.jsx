import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithAuth } from '../api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { CloudCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  fetchProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
} from '../services/productAPI';
import Spinner from '../components/Spinner';
// Search input and dropdown styles
import '../styles/ProductSearch.css';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, getCurrencyCode } from '../utils/pricingHelpers';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api').replace(/\/api$/, '');

const defaultDisplaySettings = () => ({
  label_short_description: 'Short Description',
  label_full_description: 'Full Description',
  label_retail_price: 'Retail Price',
  label_wholesale_price: 'Wholesale Price',
  label_details_show: 'Details',
  label_details_hide: 'Hide',
  label_benefits: 'Benefits for Farmers',
  label_growing_requirements: 'Growing Requirements',
  label_ingredients: 'Ingredients',
  label_directions: 'Directions for Use',
  label_out_of_stock: 'Out of stock',
  label_retail_button: 'Buy Retail',
  label_wholesale_button: 'Buy Wholesale',
  label_add_to_cart: 'Add to Cart',
  hide_short_description: false,
  hide_full_description: false,
  hide_benefits: false,
  hide_growing_requirements: false,
  hide_ingredients: false,
  hide_directions: false,
  hide_retail_button: false,
  hide_wholesale_button: false,
  hide_add_to_cart: false,
  display_style: 'carousel', // grid, carousel, list
});

export default function Products() {
  const { user, isAuthenticated } = useAuth();
  // --- Review Form State ---
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedback: '', reviewer_name: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [reviewError, setReviewError] = useState(null);
    // --- Review Submission Handler ---
    const handleReviewSubmit = async (e) => {
      e.preventDefault();
      console.log('Submitting review...');
      setReviewSubmitting(true);
      setReviewSuccess(null);
      setReviewError(null);
      try {
        // Ensure product is selected for review
        if (!editingProduct) {
          setReviewError('Select a product to review.');
          setReviewSubmitting(false);
          return;
        }
        const payload = {
          product_id: editingProduct.id,
          product_name: editingProduct.name,
          product_details: editingProduct.description || editingProduct.short_description || editingProduct.full_description || '',
          rating: reviewForm.rating,
          feedback: reviewForm.feedback,
          reviewer_name: reviewForm.reviewer_name || '',
        };
        // Use fetch directly for public review submission (no auth)
        const res = await fetch(`${BACKEND_URL}/api/customer-reviews/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res || !res.ok) {
          let errorMsg = 'Failed to submit review';
          let errorJson = null;
          try {
            errorJson = await res.json();
            errorMsg = errorJson?.detail || JSON.stringify(errorJson);
          } catch (jsonErr) {
            errorMsg = await res.text();
          }
          console.error('Review submission error:', errorMsg, errorJson);
          setReviewError(errorMsg || 'Failed to submit review');
          return;
        }
        setReviewSuccess('Review submitted!');
        setReviewForm({ rating: 5, feedback: '' });
      } catch (err) {
        console.error('Review submission exception:', err);
        setReviewError(err.message || 'Failed to submit review');
      } finally {
        setReviewSubmitting(false);
      }
    };
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const originStateRef = useRef(location.state || null);
  const clearedStateRef = useRef(false);
  const cameFromInventory = originStateRef.current?.fromInventory === true;
  const initialProductId = originStateRef.current?.productId;
  const initialOpenForm = originStateRef.current?.openForm;
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const searchInputRef = useRef(null);
  const openedFromNavRef = useRef(false);
  const deepLinkHandledRef = useRef(false);
  const openFormHandledRef = useRef(false);
    // Search/filter logic
    // Only show dropdown after user types (not on focus)
    useEffect(() => {
      if (!searchTerm) {
        setFilteredProducts(products);
        setShowDropdown(false);
        return;
      }
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.sku?.toLowerCase().includes(term) ||
          p.status?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
      setShowDropdown(searchTerm.length > 0 && filtered.length > 0);
    }, [searchTerm, products]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    fullDescription: '',
    price: '',
    retailPrice: '',
    wholesalePrice: '',
    category: '',
    stock: '',
    status: 'active',
    expiryDate: '',
    manufactureDate: '',
    dateStocked: '',
    batchNumber: '',
    supplier: '',
    benefitsText: '',
    growingRequirementsText: '',
    ingredientsText: '',
    directionsText: '',
    displaySettings: defaultDisplaySettings(),
    customFields: [],
  });
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const { pricingSettings } = useConfig();
  const fmt = useCallback((value) => formatCurrency(value, pricingSettings), [pricingSettings]);
  const currencyCode = getCurrencyCode(pricingSettings);

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('/')) {
      return `${BACKEND_URL}${url}`;
    }
    return url;
  };

  const getPrimaryProductImage = (product) => {
    if (!product) return null;
    const imagesArray = Array.isArray(product.images) ? product.images : [];
    const productImagesArray = Array.isArray(product.product_images || product.productImages)
      ? (product.product_images || product.productImages)
      : [];
    const fromProductImages = productImagesArray.length > 0
      ? (productImagesArray[0]?.image_url || productImagesArray[0]?.image)
      : null;
    const candidate = product.image || imagesArray[0] || fromProductImages;
    return resolveImageUrl(candidate);
  };

  // Helper to get tenant UUID
  const getTenantUUID = () => {
    const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
    return activeTenant?.uuid || activeTenant?.id;
  };

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const tenant_uuid = getTenantUUID();
      const data = await fetchProducts({ tenant_uuid });
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

  // Clear navigation state after capturing it, so subsequent actions on this page don't inherit it
  useEffect(() => {
    if (clearedStateRef.current) return;
    if (location.state) {
      clearedStateRef.current = true;
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  // Auto-open form when requested by navigation state
  useEffect(() => {
    if (initialOpenForm && !openFormHandledRef.current) {
      openFormHandledRef.current = true;
      openedFromNavRef.current = true;
      setEditingProduct(null);
      setShowForm(true);
    }
  }, [initialOpenForm]);

  // Open specific product for editing when navigated with productId
  useEffect(() => {
    const targetId = initialProductId;
    if (!targetId || deepLinkHandledRef.current || products.length === 0) return;

    const target = products.find((p) => String(p.id) === String(targetId));
    if (target) {
      deepLinkHandledRef.current = true;
      handleEdit(target);
    }
  }, [initialProductId, products]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      fullDescription: '',
      price: '',
      retailPrice: '',
      wholesalePrice: '',
      category: '',
      stock: '',
      status: 'active',
      expiryDate: '',
      manufactureDate: '',
      dateStocked: '',
      batchNumber: '',
      supplier: '',
      benefitsText: '',
      growingRequirementsText: '',
      ingredientsText: '',
      directionsText: '',
      displaySettings: defaultDisplaySettings(),
      customFields: [],
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setShowSaved(false);
    try {
      const payload = {
        name: formData.name,
        full_description: formData.fullDescription,
        retail_price: formData.retailPrice || '0',
        wholesale_price: formData.wholesalePrice || '0',
        category: formData.category,
        stock: formData.stock,
        status: formData.status,
        ...(formData.manufactureDate && { manufacture_date: formData.manufactureDate }),
        ...(formData.dateStocked && { date_stocked: formData.dateStocked }),
        ...(formData.expiryDate && { expiry_date: formData.expiryDate }),
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Ensure spinner for 3s
      await loadProducts();
      resetForm();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1800);

      if (cameFromInventory) {
        navigate(-1);
      }
    }
    catch (error) {
      console.error('Error saving product:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      toast.error(`Error saving product: ${errorMsg}\n\nPlease check contact 0786023858 for assistance.`);
    }
    finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      loadProducts();
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.');
    }
  };

  // Edit product
  const handleEdit = (product) => {
    const toText = (list) => (Array.isArray(list) ? list.join('\n') : '');
    const directionsToText = (list) =>
      Array.isArray(list)
        ? list
            .map((item) => {
              if (item && typeof item === 'object') {
                const method = item.method || 'Use';
                const instructions = item.instructions || '';
                return `${method}: ${instructions}`.trim();
              }
              return String(item || '');
            })
            .filter(Boolean)
            .join('\n')
        : '';

    setFormData({
      ...product,
      description: product.description || product.short_description || '',
      shortDescription: product.short_description || product.shortDescription || '',
      fullDescription: product.full_description || product.fullDescription || '',
      price: product.price || '',
      retailPrice: product.retail_price || product.retailPrice || product.price || '',
      wholesalePrice: product.wholesale_price || product.wholesalePrice || '',
      expiryDate: product.expiry_date || product.expiryDate || '',
      manufactureDate: product.manufacture_date || product.manufactureDate || '',
      dateStocked: product.date_stocked || product.dateStocked || '',
      batchNumber: product.batch_number || product.batchNumber || '',
      supplier: product.supplier || '',
      benefitsText: toText(product.benefits),
      growingRequirementsText: toText(product.growing_requirements || product.growingRequirements),
      ingredientsText: toText(product.ingredients),
      directionsText: directionsToText(product.directions),
      displaySettings: {
        ...defaultDisplaySettings(),
        ...(product.display_settings || product.displaySettings || {}),
      },
      customFields: Object.entries(product.custom_fields || product.customFields || {}).map(([key, value]) => ({ key, value: String(value || '') })),
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const updateDisplaySetting = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      displaySettings: {
        ...(prev.displaySettings || defaultDisplaySettings()),
        [key]: value,
      },
    }));
  };

  const handleCancel = () => {
    resetForm();
    if (cameFromInventory) {
      navigate(-1);
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await updateProductStatus(product.id, nextStatus);
      // Update local state immediately for instant UI feedback
      setProducts((prev) => prev.map((p) =>
        p.id === product.id ? { ...p, status: nextStatus } : p
      ));
      setFilteredProducts((prev) => prev.map((p) =>
        p.id === product.id ? { ...p, status: nextStatus } : p
      ));
      toast.success(`Product ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error updating status. Please try again.');
    }
  };



  if (saving || showSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        {saving && !showSaved && <>
          <Spinner size={64} color="#6366f1" />
          <div className="mt-4 text-lg font-semibold text-gray-700">Saving...</div>
        </>}
        {showSaved && (
          <div className="flex flex-col items-center">
            <CloudCheck className="w-12 h-12 text-green-500 mb-2 animate-bounce" />
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <CloudCheck className="w-6 h-6 mr-2 text-green-500" />
              Saved
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Stock Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 max-w-7xl mx-auto pt-6 px-2 sm:px-6">
        <div className="bg-red-100 text-red-800 rounded-lg p-2 sm:p-4 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-medium">Expired</span>
          <span className="text-xl sm:text-2xl font-bold mt-0.5">
            {products.filter(p => p.expiry_date && new Date(p.expiry_date) < new Date()).length}
          </span>
        </div>
        <div className="bg-yellow-100 text-yellow-800 rounded-lg p-2 sm:p-4 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-medium">Old Stock</span>
          <span className="text-xl sm:text-2xl font-bold mt-0.5">
            {products.filter(p => {
              if (!p.expiry_date) return false;
              const exp = new Date(p.expiry_date);
              const now = new Date();
              const soon = new Date();
              soon.setDate(now.getDate() + 30);
              return exp > now && exp < soon && Number(p.stock) > 0;
            }).length}
          </span>
        </div>
        <div className="bg-green-100 text-green-800 rounded-lg p-2 sm:p-4 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-medium">In Stock</span>
          <span className="text-xl sm:text-2xl font-bold mt-0.5">
            {products.filter(p => Number(p.stock) > 0 && (!p.expiry_date || new Date(p.expiry_date) > new Date())).length}
          </span>
        </div>
      </div>
      {/* --- Product Review Form (User) --- */}
      {editingProduct && (
        <div className="max-w-xl mx-auto my-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Leave a Review for {editingProduct.name}</h2>
          {/* Show reviews for this product */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Customer Reviews</h3>
            {/* Fetch and display reviews for the product */}
            <ProductReviews productId={editingProduct.id} />
          </div>
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-red-600 font-semibold">You must be logged in to leave a review.</div>
              <div className="flex gap-4">
                <Link to={`/login?next=${encodeURIComponent(window.location.pathname)}`} className="text-blue-600 underline">Login</Link>
                <Link to="/register" className="text-blue-600 underline">Sign Up</Link>
                <Link to="/forgot-password" className="text-blue-600 underline">Forgot Password?</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  value={reviewForm.reviewer_name}
                  onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  maxLength={100}
                  placeholder="Enter your name (optional)"
                  disabled={reviewSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                  className="w-24 border rounded px-2 py-1"
                  disabled={reviewSubmitting}
                >
                  {[5,4,3,2,1].map(r => (
                    <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Feedback</label>
                <textarea
                  value={reviewForm.feedback}
                  onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  required
                  disabled={reviewSubmitting}
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              {reviewSuccess && <div className="text-green-600 mt-2">{reviewSuccess}</div>}
              {reviewError && <div className="text-red-600 mt-2">{reviewError}</div>}
            </form>
          )}
        </div>
      )}
      {/* Search Input & Dropdown */}
      <div className="max-w-7xl mx-auto pt-4 pb-2 px-2 sm:px-6">
        <div className="relative w-full md:w-1/2">
          <input
            ref={searchInputRef}
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search products by name, category, SKU, status..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700"
                  onMouseDown={() => {
                    setSearchTerm(product.name);
                    setShowDropdown(false);
                    if (searchInputRef.current) searchInputRef.current.blur();
                  }}
                >
                  <img
                    src={getPrimaryProductImage(product) || ''}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>{product.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.short_description || product.shortDescription || product.description}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-700 dark:text-gray-200">Stock: <b>{product.stock}</b></span>
                      <span className="text-xs text-gray-700 dark:text-gray-200">Retail: <b>{fmt(parseFloat(product.retail_price || product.price || 0))}</b></span>
                      <span className="text-xs text-gray-700 dark:text-gray-200">Wholesale: <b>{fmt(parseFloat(product.wholesale_price || product.price || 0))}</b></span>
                      <span className="text-xs text-gray-400">{product.category}</span>
                      <span className="text-xs text-gray-400">{product.sku}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No matching products found.</div>
              )}
            </div>
          )}
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 overflow-hidden">
          <div className="h-screen flex flex-col bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
              {/* Form Section - Full Width */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  {/* Descriptions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description</label>
                    <textarea
                      value={formData.fullDescription}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullDescription: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="4"
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retail Price ({currencyCode})</label>
                      <input
                        type="number"
                        value={formData.retailPrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, retailPrice: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wholesale Price ({currencyCode})</label>
                      <input
                        type="number"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData((prev) => ({ ...prev, wholesalePrice: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Stock & Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <input
                        type="text"
                        list="category-suggestions"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Type or select a category"
                      />
                      <datalist id="category-suggestions">
                        {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Inventory Management Fields */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-blue-900 dark:text-blue-100 mb-3">Inventory Management</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date Manufactured <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          value={formData.manufactureDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, manufactureDate: e.target.value }))}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date Stocked <span className="text-red-500 text-xs">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.dateStocked}
                          onChange={(e) => setFormData((prev) => ({ ...prev, dateStocked: e.target.value }))}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Expiry Date <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Products auto-deactivate when expired or out of stock
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-6">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4" /> {editingProduct ? 'Update' : 'Save'} Product
                    </button>
                    <button type="button" onClick={handleCancel} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main Content - Products List */}
      <div className="px-2 sm:px-6 pb-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products Management</h1>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Retail / Wholesale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => {
                    const primaryImage = getPrimaryProductImage(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          {primaryImage ? (
                            <img
                              src={`${primaryImage}${primaryImage.includes('?') ? '&' : '?'}v=${product.updated_at || Date.now()}`}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {fmt(parseFloat(product.retail_price || product.price || 0))}
                        <span className="text-gray-500"> / </span>
                        {fmt(parseFloat(product.wholesale_price || product.price || 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{product.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {product.status}
                          </span>
                          {/* Manual Inactivate/Activate Button */}
                          <button
                            onClick={() => {
                              // Only allow activate if not expired and in stock
                              if (product.status === 'inactive') {
                                const isExpired = product.expiry_date && new Date(product.expiry_date) < new Date();
                                const isOutOfStock = !product.stock || Number(product.stock) <= 0;
                                if (isExpired || isOutOfStock) {
                                  toast.error('Cannot activate expired or out-of-stock product.');
                                  return;
                                }
                              }
                              handleToggleStatus(product);
                            }}
                            className={`text-xs px-3 py-1 rounded font-semibold transition-colors ${
                              product.status === 'active'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            title={product.status === 'active' ? 'Inactivate product' : 'Activate product'}
                          >
                            {product.status === 'active' ? 'Inactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
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
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Product Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ProductReviews component - Shows customer reviews for a product
function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/customer-reviews/product-reviews/?product_id=${productId}`);
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    if (productId) fetchReviews();
  }, [productId]);

  if (loading) return <div className="text-gray-500">Loading reviews...</div>;
  if (!reviews.length) return <div className="text-gray-400">No reviews yet.</div>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700">{r.reviewer_name || "Anonymous"}</span>
            <span className="text-yellow-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <div className="mt-1">{r.feedback}</div>
        </div>
      ))}
    </div>
  );
}


