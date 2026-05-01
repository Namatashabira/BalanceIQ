import { fetchWithAuth } from '../api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api';

// Fetch products
// options:
// - userView: boolean → when true, backend filters to active user-facing products
// - signal: AbortSignal for cancellation (optional)
// Default: if no auth token is present, automatically request user_view=true
export const fetchProducts = async (options = {}) => {
  const token = localStorage.getItem('accessToken');
  const { userView, signal } = options;
  const effectiveUserView = typeof userView === 'boolean' ? userView : !token;

  // Always resolve tenant_uuid from active tenant in localStorage
  const activeTenant = (() => {
    try { return JSON.parse(localStorage.getItem('activeTenant')); } catch { return null; }
  })();
  const tenant_uuid = options.tenant_uuid || activeTenant?.uuid || activeTenant?.id || null;

  const url = new URL(`${API_BASE_URL}/products/`);
  if (effectiveUserView) url.searchParams.set('user_view', 'true');
  if (tenant_uuid) url.searchParams.set('tenant_uuid', tenant_uuid);

  try {
    const response = await fetchWithAuth(url.toString(), { signal });
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      throw new Error(`HTTP error! status: ${status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Create new product
export const createProduct = async (payload) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response || !response.ok) {
      const text = response ? await response.text() : 'no response';
      throw new Error(`Create failed ${response?.status}: ${text}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, payload) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response || !response.ok) {
      const text = response ? await response.text() : 'no response';
      throw new Error(`Update failed ${response?.status}: ${text}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Partial update for status toggles
export const updateProductStatus = async (productId, nextStatus) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response || !response.ok) {
      const text = response ? await response.text() : 'no response';
      throw new Error(`Status update failed ${response?.status}: ${text}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating product status:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`, {
      method: 'DELETE',
    });
    
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      throw new Error(`HTTP error! status: ${status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};


// Get product by ID
export const getProduct = async (productId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`);
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      throw new Error(`HTTP error! status: ${status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};