import { fetchWithAuth } from '../api.js';

const BASE_URL = "http://127.0.0.1:8000/api";

class OrderAPI {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async retry(fn, attempts = this.retryAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retry(fn, attempts - 1);
      }
      throw error;
    }
  }

  async getAll() {
    try {
      const response = await this.retry(async () => {
        const res = await fetchWithAuth(`${BASE_URL}/core/orders/manual-entry/`);
        if (!res || !res.ok) {
          throw new Error(`Failed to fetch orders: ${res?.status}`);
        }
        return res;
      });
      
      const data = await response.json();
      const orders = Array.isArray(data) ? data : [];
      
      // Store successful fetch in local storage
      this.storeLocalData(orders);
      return orders;
    } catch (error) {
      console.error('OrderAPI.getAll error:', error);
      return this.getLocalData();
    }
  }

  async create(orderData) {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/core/orders/manual-entry/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response || !response.ok) {
        throw new Error(`Failed to create order: ${response?.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('OrderAPI.create error:', error);
      throw error;
    }
  }

  async update(orderId, orderData) {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/core/orders/manual-entry/${orderId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response || !response.ok) {
        throw new Error(`Failed to update order: ${response?.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('OrderAPI.update error:', error);
      throw error;
    }
  }

  async delete(orderId) {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/core/orders/manual-entry/${orderId}/`, {
        method: 'DELETE'
      });
      
      if (!response || !response.ok) {
        throw new Error(`Failed to delete order: ${response?.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('OrderAPI.delete error:', error);
      throw error;
    }
  }

  async bulkUpdate(orders) {
    if (!this.isOnline) {
      // Queue for later sync
      this.addToSyncQueue('bulkUpdate', { orders });
      this.storeLocalData(orders);
      throw new Error('Offline: Changes queued for sync');
    }

    try {
      const response = await this.retry(async () => {
        const res = await fetchWithAuth(`${BASE_URL}/core/orders/manual-entry/bulk/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders })
        });
        
        if (!res || !res.ok) {
          throw new Error(`Failed to bulk update orders: ${res?.status}`);
        }
        
        return res;
      });
      
      const result = await response.json();
      
      // Update local storage with successful sync
      this.storeLocalData(orders);
      this.clearSyncQueue();
      
      return result;
    } catch (error) {
      console.error('OrderAPI.bulkUpdate error:', error);
      this.addToSyncQueue('bulkUpdate', { orders });
      this.storeLocalData(orders);
      throw error;
    }
  }

  addToSyncQueue(operation, data) {
    this.syncQueue.push({ operation, data, timestamp: Date.now() });
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async processSyncQueue() {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    this.syncQueue = queue;

    for (const item of this.syncQueue) {
      try {
        switch (item.operation) {
          case 'bulkUpdate':
            await this.bulkUpdate(item.data.orders);
            break;
          case 'create':
            await this.create(item.data);
            break;
          case 'update':
            await this.update(item.data.id, item.data);
            break;
          case 'delete':
            await this.delete(item.data.id);
            break;
        }
      } catch (error) {
        console.error('Sync queue processing error:', error);
        break; // Stop processing on error
      }
    }
  }

  clearSyncQueue() {
    this.syncQueue = [];
    localStorage.removeItem('syncQueue');
  }

  getLocalData() {
    try {
      const stored = localStorage.getItem('manualEntryData');
      if (stored) {
        const parsedData = JSON.parse(stored);
        // Handle both old and new format
        return Array.isArray(parsedData) ? parsedData : parsedData.data || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to get local data:', error);
      return [];
    }
  }

  async getFromIndexedDB() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('ManualEntryDB', 1);
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['orders'], 'readonly');
          const store = transaction.objectStore('orders');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result || []);
          };
          
          getAllRequest.onerror = () => {
            resolve([]);
          };
        };
        
        request.onerror = () => {
          resolve([]);
        };
      } catch (error) {
        console.error('IndexedDB retrieval error:', error);
        resolve([]);
      }
    });
  }

  // Real-time sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingSync: this.syncQueue.length,
      lastSync: localStorage.getItem('lastSyncTime'),
      hasLocalChanges: this.syncQueue.length > 0
    };
  }

  storeLocalData(data) {
    try {
      const storageData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem('manualEntryData', JSON.stringify(storageData));
      
      // Also store in IndexedDB for larger datasets
      this.storeInIndexedDB(data);
    } catch (error) {
      console.error('Failed to store local data:', error);
    }
  }

  async storeInIndexedDB(data) {
    try {
      const request = indexedDB.open('ManualEntryDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['orders'], 'readwrite');
        const store = transaction.objectStore('orders');
        
        // Clear existing data
        store.clear();
        
        // Store new data
        data.forEach(item => store.add(item));
      };
    } catch (error) {
      console.error('IndexedDB storage error:', error);
    }
  }

  async syncLocalData() {
    try {
      if (!this.isOnline) {
        return false;
      }

      const localData = this.getLocalData();
      const indexedData = await this.getFromIndexedDB();
      
      // Use IndexedDB data if available and more recent
      const dataToSync = indexedData.length > localData.length ? indexedData : localData;
      
      if (dataToSync.length > 0) {
        await this.bulkUpdate(dataToSync);
        localStorage.setItem('lastSyncTime', new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync local data:', error);
      return false;
    }
  }

  // WebSocket connection for real-time updates
  connectWebSocket() {
    if (typeof WebSocket === 'undefined') return;

    try {
      const wsUrl = BASE_URL.replace('http', 'ws') + '/ws/manual-entry/';
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for real-time updates');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order_update') {
            // Trigger update event for components to refresh
            window.dispatchEvent(new CustomEvent('orderUpdate', { detail: data }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 2 seconds
        setTimeout(() => this.connectWebSocket(), 2000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const orderAPI = new OrderAPI();

// Initialize WebSocket connection
if (typeof window !== 'undefined') {
  orderAPI.connectWebSocket();
}

export default orderAPI;