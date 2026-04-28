import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/accounting';

// Add axios interceptor to handle 401 errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to get auth headers
const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

// Expense Categories API
export const fetchExpenseCategories = async () => {
  const response = await axios.get(`${API_URL}/expense-categories/`, getHeaders());
  return response.data;
};

export const createExpenseCategory = async (data) => {
  const response = await axios.post(`${API_URL}/expense-categories/`, data, getHeaders());
  return response.data;
};

// Expenses API
export const fetchExpenses = async (params = {}) => {
  const response = await axios.get(`${API_URL}/expenses/`, { ...getHeaders(), params });
  return response.data;
};

export const fetchExpenseSummary = async () => {
  const response = await axios.get(`${API_URL}/expenses/summary/`, getHeaders());
  return response.data;
};

export const createExpense = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  const response = await axios.post(`${API_URL}/expenses/`, formData, {
    headers: {
      Authorization: getHeaders().headers.Authorization,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateExpense = async (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  const response = await axios.put(`${API_URL}/expenses/${id}/`, formData, {
    headers: {
      Authorization: getHeaders().headers.Authorization,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteExpense = async (id) => {
  await axios.delete(`${API_URL}/expenses/${id}/`, getHeaders());
};

// Payments API
export const fetchPayments = async (params = {}) => {
  const response = await axios.get(`${API_URL}/payments/`, { ...getHeaders(), params });
  return response.data;
};

export const fetchPaymentSummary = async () => {
  const response = await axios.get(`${API_URL}/payments/summary/`, getHeaders());
  return response.data;
};

export const createPayment = async (data) => {
  const response = await axios.post(`${API_URL}/payments/`, data, getHeaders());
  return response.data;
};

export const updatePayment = async (id, data) => {
  const response = await axios.put(`${API_URL}/payments/${id}/`, data, getHeaders());
  return response.data;
};

export const deletePayment = async (id) => {
  await axios.delete(`${API_URL}/payments/${id}/`, getHeaders());
};

// Taxes API
export const fetchTaxes = async (params = {}) => {
  const response = await axios.get(`${API_URL}/taxes/`, { ...getHeaders(), params });
  return response.data;
};

export const fetchTaxSummary = async () => {
  const response = await axios.get(`${API_URL}/taxes/summary/`, getHeaders());
  return response.data;
};

export const createTax = async (data) => {
  const response = await axios.post(`${API_URL}/taxes/`, data, getHeaders());
  return response.data;
};

export const updateTax = async (id, data) => {
  const response = await axios.put(`${API_URL}/taxes/${id}/`, data, getHeaders());
  return response.data;
};

export const deleteTax = async (id) => {
  await axios.delete(`${API_URL}/taxes/${id}/`, getHeaders());
};

// Assets API
export const fetchAssets = async () => {
  const response = await axios.get(`${API_URL}/assets/`, getHeaders());
  return response.data;
};

export const createAsset = async (data) => {
  const response = await axios.post(`${API_URL}/assets/`, data, getHeaders());
  return response.data;
};

export const updateAsset = async (id, data) => {
  const response = await axios.put(`${API_URL}/assets/${id}/`, data, getHeaders());
  return response.data;
};

export const deleteAsset = async (id) => {
  await axios.delete(`${API_URL}/assets/${id}/`, getHeaders());
};

// Liabilities API
export const fetchLiabilities = async () => {
  const response = await axios.get(`${API_URL}/liabilities/`, getHeaders());
  return response.data;
};

export const createLiability = async (data) => {
  const response = await axios.post(`${API_URL}/liabilities/`, data, getHeaders());
  return response.data;
};

export const updateLiability = async (id, data) => {
  const response = await axios.put(`${API_URL}/liabilities/${id}/`, data, getHeaders());
  return response.data;
};

export const deleteLiability = async (id) => {
  await axios.delete(`${API_URL}/liabilities/${id}/`, getHeaders());
};

// Equity API
export const fetchEquity = async () => {
  const response = await axios.get(`${API_URL}/equity/`, getHeaders());
  return response.data;
};

export const createEquity = async (data) => {
  const response = await axios.post(`${API_URL}/equity/`, data, getHeaders());
  return response.data;
};

export const updateEquity = async (id, data) => {
  const response = await axios.put(`${API_URL}/equity/${id}/`, data, getHeaders());
  return response.data;
};

export const deleteEquity = async (id) => {
  await axios.delete(`${API_URL}/equity/${id}/`, getHeaders());
};

// Profit & Loss API
export const fetchProfitLoss = async (params = {}) => {
  const response = await axios.get(`${API_URL}/profit-loss/`, { ...getHeaders(), params });
  return response.data;
};

// Balance Sheet API
export const fetchBalanceSheet = async () => {
  const response = await axios.get(`${API_URL}/balance-sheet/`, getHeaders());
  return response.data;
};
