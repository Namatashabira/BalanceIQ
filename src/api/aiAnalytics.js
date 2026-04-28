// AI Analytics API Service
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/core';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const aiAnalyticsAPI = {
  // Get sales forecast
  getSalesForecast: async (daysBack = 90, daysAhead = 30) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ai/sales-forecast/?days_back=${daysBack}&days_ahead=${daysAhead}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sales forecast:', error);
      throw error;
    }
  },

  // Get inventory optimization suggestions
  getInventoryOptimization: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ai/inventory-optimization/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory optimization:', error);
      throw error;
    }
  },

  // Get customer behavior analysis
  getCustomerBehavior: async (daysBack = 90) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ai/customer-behavior/?days_back=${daysBack}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching customer behavior:', error);
      throw error;
    }
  },

  // Get profit/loss prediction
  getProfitPrediction: async (monthsBack = 12) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ai/profit-prediction/?months_back=${monthsBack}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching profit prediction:', error);
      throw error;
    }
  },

  // Get comprehensive AI insights (for dashboard)
  getComprehensiveInsights: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/ai/comprehensive-insights/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive insights:', error);
      throw error;
    }
  },
};

export default aiAnalyticsAPI;
