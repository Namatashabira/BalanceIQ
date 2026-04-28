import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/core';

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// OpenAI-powered API calls
export const openAIAPI = {
  // Get comprehensive business insights
  getBusinessInsights: async (daysBack = 30) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/openai/business-insights/`,
        {
          params: { days_back: daysBack },
          headers: getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get personalized product recommendations for a customer
  getProductRecommendations: async (customerEmail) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/openai/product-recommendations/`,
        {
          params: { customer_email: customerEmail },
          headers: getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get inventory management strategy
  getInventoryStrategy: async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/openai/inventory-strategy/`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Generate customer message
  generateCustomerMessage: async (customerEmail, messageType = 'followup') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/openai/customer-message/`,
        {
          customer_email: customerEmail,
          message_type: messageType
        },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sales trend analysis
  getSalesAnalysis: async (daysBack = 30) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/openai/sales-analysis/`,
        {
          params: { days_back: daysBack },
          headers: getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default openAIAPI;
