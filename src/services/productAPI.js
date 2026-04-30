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

// Create new product (multipart, supports image upload)
export const createProduct = async (formData) => {
  try {
    console.log('[productAPI.createProduct] Sending FormData with fields:', Array.from(formData.keys()));
    const response = await fetchWithAuth(`${API_BASE_URL}/products/`, {
      method: 'POST',
      body: formData,
    });
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      const text = response ? await response.text() : 'no response';
      throw new Error(`Create failed ${status}: ${text}`);
    }
    const data = await response.json();
    console.log('[productAPI.createProduct] Response data:', {
      id: data.id,
      name: data.name,
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      images: data.images
    });
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product (multipart, supports image upload)
export const updateProduct = async (productId, formData) => {
  try {
    console.log('[productAPI.updateProduct] Sending FormData for product', productId, 'with fields:', Array.from(formData.keys()));
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      const text = response ? await response.text() : 'no response';
      throw new Error(`Update failed ${status}: ${text}`);
    }
    const data = await response.json();
    console.log('[productAPI.updateProduct] Response data:', {
      id: data.id,
      name: data.name,
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      images: data.images
    });
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Partial update for status toggles
export const updateProductStatus = async (productId, nextStatus) => {
  try {
    const payload = new FormData();
    payload.append('status', nextStatus);

    const response = await fetchWithAuth(`${API_BASE_URL}/products/${productId}/`, {
      method: 'PATCH',
      body: payload,
    });

    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      const text = response ? await response.text() : 'no response';
      throw new Error(`Status update failed ${status}: ${text}`);
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

// Upload product image
export const uploadProductImage = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/upload/`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response || !response.ok) {
      const status = response?.status ?? 'unknown';
      throw new Error(`HTTP error! status: ${status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
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