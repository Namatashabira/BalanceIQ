/**
 * API Client for Oraka
 * Handles authentication, offline mode, and app source tracking
 * 
 * Usage:
 * import { api } from '@/services/api';
 * api.get('/orders/').then(res => console.log(res.data));
 */

import axios from 'axios';

// Create API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Add app source header to identify where request comes from
 */
function addAppSourceHeader() {
  let appSource = 'web';
  let appVersion = null;

  // Check if running in Electron
  if (window.electronAPI) {
    appSource = 'electron';
    window.electronAPI.getAppVersion?.().then(version => {
      api.defaults.headers.common['X-App-Version'] = version;
    });
  }
  // Check if running as PWA
  else if (window.matchMedia('(display-mode: standalone)').matches) {
    appSource = 'pwa';
  }

  api.defaults.headers.common['X-App-Source'] = appSource;
}

/**
 * Request interceptor - Add auth token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle 401, offline, and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network error (offline)
    if (!error.response && !navigator.onLine) {
      console.warn('API: Offline - attempting to use cached data');
      // Try to return cached response
      const cachedResponse = await getCachedResponse(originalRequest.url);
      if (cachedResponse) {
        return cachedResponse;
      }
      return Promise.reject({
        ...error,
        message: 'Offline - Data unavailable'
      });
    }

    // Handle 401 - Token expired, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
          // No refresh token, redirect to login
          redirectToLogin();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${api.defaults.baseURL}/token/refresh/`,
          { refresh },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        api.defaults.headers.Authorization = `Bearer ${access}`;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 - Rate limited
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.warn(`API: Rate limited. Retry after ${retryAfter}s`);
      
      // Exponential backoff retry
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(api(originalRequest));
          }, delay);
        });
      }
    }

    // Handle 5xx errors
    if (error.response?.status >= 500) {
      console.error('API: Server error', error.response.status);
    }

    return Promise.reject(error);
  }
);

/**
 * Get cached API response using Service Worker cache
 */
async function getCachedResponse(url) {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const cache = await caches.open('oraka-api');
    const response = await cache.match(url);
    if (response) {
      console.log('API: Using cached response for', url);
      return Promise.resolve(response);
    }
  } catch (error) {
    console.error('Cache retrieval error:', error);
  }

  return null;
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/BalanceIQ/login';
}

/**
 * Initialize app source tracking
 */
addAppSourceHeader();

/**
 * API Methods
 */
export const apiEndpoints = {
  // Authentication
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),

  // Orders
  getOrders: (params) => api.get('/orders/', { params }),
  createOrder: (data) => api.post('/orders/', data),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}/`),

  // Inventory
  getInventory: (params) => api.get('/inventory/', { params }),
  updateInventory: (id, data) => api.patch(`/inventory/${id}/`, data),

  // Dashboard
  getDashboard: (params) => api.get('/dashboard/', { params }),
  getAnalytics: (params) => api.get('/analytics/', { params }),

  // Sync offline changes
  syncOfflineData: (changes) => api.post('/sync/', { changes }),

  // Settings
  getSettings: () => api.get('/settings/'),
  updateSettings: (data) => api.patch('/settings/', data),
};

/**
 * Offline data management
 */
export class OfflineDataManager {
  constructor() {
    this.storeName = 'oraka-offline-changes';
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('orakaDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveOfflineChange(type, data) {
    const db = await this.initDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    store.add({
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllChanges() {
    const db = await this.initDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async syncChanges() {
    if (!navigator.onLine) {
      console.log('Offline - cannot sync');
      return;
    }

    const changes = await this.getAllChanges();
    if (changes.length === 0) return;

    try {
      const response = await api.post('/sync/', { changes });
      console.log('Sync successful:', response.data);
      
      // Clear synced changes
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
}

export const offlineManager = new OfflineDataManager();

/**
 * Listen for online status and sync when back online
 */
window.addEventListener('online', async () => {
  console.log('Back online - syncing changes...');
  try {
    await offlineManager.syncChanges();
  } catch (error) {
    console.error('Failed to sync offline changes:', error);
  }
});

export default api;
