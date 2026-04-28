const BASE_URL = "http://127.0.0.1:8000/api"; // consistent with user frontend

// ---------- Helper: fetch with JWT + auto-refresh ----------
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("accessToken");
  const headers = options.headers || {};

  console.log('fetchWithAuth called:', { url, token: token ? 'present' : 'missing' });

  // Add auth header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });
  console.log('Initial response:', res.status, res.statusText);

  // If 401, try refreshing token once
  if (res.status === 401 && token) {
    console.log('Got 401, attempting token refresh');
    const newToken = await refreshToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
      console.log('Retry response:', res.status, res.statusText);
    } else {
      console.log('Token refresh failed, logging out');
      logoutUser();
      return null;
    }
  }

  return res;
}

// ---------- Orders ----------
export async function fetchOrders(status) {
  try {
    const activeTenant = (() => { try { return JSON.parse(localStorage.getItem('activeTenant')); } catch { return null; } })();
    const tenant_uuid = activeTenant?.uuid || activeTenant?.id || '';
    const url = `${BASE_URL}/core/orders/?status=${encodeURIComponent(status)}${tenant_uuid ? `&tenant_uuid=${tenant_uuid}` : ''}`;
    console.log('Fetching orders from:', url);
    const response = await fetchWithAuth(url);
    
    if (!response) {
      console.error('No response received from fetchWithAuth');
      return [];
    }
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch orders: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch orders (HTTP ${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    console.log('Orders fetched successfully:', Array.isArray(data) ? data.length : 'not an array', 'orders');
    
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('API returned non-array data:', typeof data, data);
      return [];
    }
    
    return data;
  } catch (err) {
    console.error("fetchOrders error:", err);
    return [];
  }
}

// ---------- Update order status (Confirm / Cancel) ----------
export async function updateOrderStatus(orderId, status) {
  try {
    const url = `${BASE_URL}/core/orders/`;
    console.log(`API: Updating order ${orderId} to ${status} at ${url}`);
    const res = await fetchWithAuth(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    console.log('API Response status:', res?.status);
    if (!res || !res.ok) {
      const errorText = await res?.text();
      console.error('API Error response:', errorText);
      throw new Error(`Failed to update order status: ${res?.status} ${errorText}`);
    }
    const result = await res.json();
    console.log('API Success response:', result);
    return result;
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return null;
  }
}

// ---------- Workers (Tenant Admin) ----------
export async function fetchWorkers() {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/workers/`);
    if (!res || !res.ok) throw new Error("Failed to fetch workers");
    return await res.json();
  } catch (err) {
    console.error("fetchWorkers error:", err);
    return [];
  }
}

export async function fetchWorkerPermissions(workerId) {
  try {
    const res = await fetchWithAuth(
      `${BASE_URL}/tenants/workers/${workerId}/permissions/`
    );
    if (!res || !res.ok) throw new Error("Failed to fetch worker permissions");
    return await res.json();
  } catch (err) {
    console.error("fetchWorkerPermissions error:", err);
    return null;
  }
}

export async function updateWorkerPermissions(workerId, permissions) {
  try {
    const res = await fetchWithAuth(
      `${BASE_URL}/tenants/workers/${workerId}/permissions/`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      }
    );
    if (!res || !res.ok) throw new Error("Failed to update permissions");
    return await res.json();
  } catch (err) {
    console.error("updateWorkerPermissions error:", err);
    return null;
  }
}

export async function createWorker(data) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/workers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res || !res.ok) throw new Error("Failed to create worker");
    return await res.json();
  } catch (err) {
    console.error("createWorker error:", err);
    return null;
  }
}

export async function deleteWorker(workerId) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/workers/${workerId}/`, {
      method: "DELETE",
    });
    if (!res || !res.ok) throw new Error("Failed to delete worker");
    return true;
  } catch (err) {
    console.error("deleteWorker error:", err);
    return null;
  }
}

// ---------- Tenants (Superadmin) ----------
export async function fetchTenants() {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/`);
    if (!res || !res.ok) throw new Error("Failed to fetch tenants");
    return await res.json();
  } catch (err) {
    console.error("fetchTenants error:", err);
    return [];
  }
}

export async function createTenant(data) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res || !res.ok) throw new Error("Failed to create tenant");
    return await res.json();
  } catch (err) {
    console.error("createTenant error:", err);
    return null;
  }
}

export async function deleteTenant(tenantId) {
  try {
    const res = await fetchWithAuth(`${BASE_URL}/tenants/${tenantId}/`, {
      method: "DELETE",
    });
    if (!res || !res.ok) throw new Error("Failed to delete tenant");
    return true;
  } catch (err) {
    console.error("deleteTenant error:", err);
    return null;
  }
}

// Helper to get active tenant UUID from localStorage
export function getActiveTenantUUID() {
  const activeTenant = JSON.parse(localStorage.getItem('activeTenant'));
  return activeTenant?.uuid || activeTenant?.id;
}

// ---------- Authentication ----------
export async function loginUser(username, password) {
  try {
    const res = await fetch(`${BASE_URL}/core/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    // Always try to parse JSON once
    let data = null;
    let isJson = true;
    try {
      data = await res.clone().json();
    } catch (e) {
      isJson = false;
    }

    // 202 indicates OTP is valid and user must set password
    if (res.status === 202 && isJson) {
      return data; // contains otp_valid flag
    }

    if (!res.ok) {
      if (isJson && data && data.error) {
        throw new Error(data.error || "Login failed");
      } else {
        // HTML or unknown error
        const text = await res.text();
        throw new Error("Server error: " + (text.slice(0, 120) || res.statusText));
      }
    }

    if (!isJson) {
      // Unexpected HTML or text response
      const text = await res.text();
      throw new Error("Unexpected server response: " + (text.slice(0, 120) || res.statusText));
    }

    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));
    // Store tenant so all API calls can scope to this tenant
    if (data.user?.tenant) {
      localStorage.setItem("activeTenant", JSON.stringify(data.user.tenant));
    }

    console.log('Login successful:', data.user);
    return data;
  } catch (err) {
    console.error("loginUser error:", err);
    throw err;
  }
}

export async function refreshToken() {
  try {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return null;

    const res = await fetch(`${BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null; // expired refresh token
    const data = await res.json();
    localStorage.setItem("accessToken", data.access);
    return data.access;
  } catch (err) {
    console.error("refreshToken error:", err);
    return null;
  }
}

export async function logoutUser() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await fetch(`${BASE_URL}/core/auth/logout/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    }
  } catch (err) {
    console.error("Logout API error:", err);
  } finally {
    // Clear all local and session storage on logout
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }
}

// ---------- Analytics ----------
export async function fetchAnalytics(dateRange = '7d') {
  try {
    const url = `${BASE_URL}/core/analytics/?range=${dateRange}`;
    console.log('Fetching analytics from:', url);
    
    const res = await fetchWithAuth(url);
    console.log('Analytics response status:', res?.status);
    
    if (!res) {
      console.error('No response received from fetchWithAuth');
      window.__lastAnalyticsError = 'No response';
      return null;
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Analytics API error: ${res.status} ${res.statusText}`, errorText);
      window.__lastAnalyticsError = `${res.status} ${errorText}`;
      return null;
    }
    
    const data = await res.json();
    window.__lastAnalyticsError = null;
    console.log('Analytics data parsed successfully:', Object.keys(data));
    return data;
  } catch (err) {
    console.error("fetchAnalytics error:", err);
    window.__lastAnalyticsError = err?.message || String(err);
    return null;
  }
}

// ---------- Forecast ----------
export async function fetchForecastData(params = {}) {
  try {
    const queryParams = new URLSearchParams({
      dateRange: params.dateRange || '30d',
      scenario: params.scenario || 'expected',
      priceType: params.priceType || 'both',
      category: params.category || 'all'
    });
    
    const url = `${BASE_URL}/core/forecast/?${queryParams}`;
    console.log('Fetching forecast from:', url);
    
    const res = await fetchWithAuth(url);
    
    if (!res) {
      console.error('No response received from fetchWithAuth');
      return null;
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Forecast API error: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`Failed to fetch forecast: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Forecast data parsed successfully:', Object.keys(data));
    return data;
  } catch (err) {
    console.error("fetchForecastData error:", err);
    return null;
  }
}

export async function fetchSalesForecast(days = 30, scenario = 'expected') {
  try {
    const url = `${BASE_URL}/core/forecast/sales/?days=${days}&scenario=${scenario}`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch sales forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchSalesForecast error:", err);
    return null;
  }
}

export async function fetchDemandForecast(params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const url = `${BASE_URL}/core/forecast/demand/?${queryParams}`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch demand forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchDemandForecast error:", err);
    return null;
  }
}

export async function fetchInventoryForecast() {
  try {
    const url = `${BASE_URL}/core/forecast/inventory/`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch inventory forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchInventoryForecast error:", err);
    return null;
  }
}

export async function fetchPricingForecast(params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const url = `${BASE_URL}/core/forecast/pricing/?${queryParams}`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch pricing forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchPricingForecast error:", err);
    return null;
  }
}

export async function fetchMarketingForecast() {
  try {
    const url = `${BASE_URL}/core/forecast/marketing/`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch marketing forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchMarketingForecast error:", err);
    return null;
  }
}

export async function fetchGeographicForecast() {
  try {
    const url = `${BASE_URL}/core/forecast/geographic/`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch geographic forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchGeographicForecast error:", err);
    return null;
  }
}

export async function fetchFinancialForecast() {
  try {
    const url = `${BASE_URL}/core/forecast/financial/`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch financial forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchFinancialForecast error:", err);
    return null;
  }
}

export async function fetchRiskForecast() {
  try {
    const url = `${BASE_URL}/core/forecast/risks/`;
    const res = await fetchWithAuth(url);
    
    if (!res || !res.ok) {
      throw new Error(`Failed to fetch risk forecast: ${res?.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("fetchRiskForecast error:", err);
    return null;
  }
}

// Get current user from localStorage
export function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error("Error parsing user data:", err);
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem("accessToken");
  const user = getCurrentUser();
  return !!(token && user);
}

// ---------- Password Reset ----------
export async function requestPasswordReset(email) {
  try {
    const res = await fetch(`${BASE_URL}/core/auth/password-reset/request/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    
    // Check if endpoint exists (404 means not implemented yet)
    if (res.status === 404) {
      console.warn('Password reset endpoint not implemented, using mock response');
      // Mock successful response
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        message: 'Reset link sent',
        mock: true 
      };
    }
    
    if (!res.ok) {
      const errorData = await res.json();
      throw { response: { data: errorData } };
    }
    
    return await res.json();
  } catch (err) {
    // If it's a parsing error (HTML response), use mock
    if (err instanceof SyntaxError) {
      console.warn('Received HTML instead of JSON, using mock response');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        message: 'Reset link sent',
        mock: true 
      };
    }
    console.error("requestPasswordReset error:", err);
    throw err;
  }
}

export async function verifyResetToken(token) {
  try {
    const res = await fetch(`${BASE_URL}/core/auth/password-reset/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    
    // Check if endpoint exists
    if (res.status === 404) {
      console.warn('Token verification endpoint not implemented, using mock response');
      // Mock successful verification with 30 second timer
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        valid: true, 
        timeLeft: 30,
        mock: true 
      };
    }
    
    if (!res.ok) {
      const errorData = await res.json();
      throw { response: { data: errorData } };
    }
    
    return await res.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn('Received HTML instead of JSON, using mock response');
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        valid: true, 
        timeLeft: 30,
        mock: true 
      };
    }
    console.error("verifyResetToken error:", err);
    throw err;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const res = await fetch(`${BASE_URL}/core/auth/password-reset/confirm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    
    // Check if endpoint exists
    if (res.status === 404) {
      console.warn('Password reset confirm endpoint not implemented, using mock response');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        message: 'Password reset successful',
        mock: true 
      };
    }
    
    if (!res.ok) {
      const errorData = await res.json();
      throw { response: { data: errorData } };
    }
    
    return await res.json();
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn('Received HTML instead of JSON, using mock response');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        message: 'Password reset successful',
        mock: true 
      };
    }
    console.error("resetPassword error:", err);
    throw err;
  }
}

/// Upload product image (optional for separate upload endpoint)
export async function uploadProductImage(file, productId = null) {
  if (!file) throw new Error("File is required");

  // Prepare FormData with the actual file
  const formData = new FormData();
  formData.append("image", file); // must match your Django serializer's field name

  let url = `${BASE_URL}/products/`;
  let method = "POST";

  if (productId) {
    // Upload for existing product
    url += `${productId}/upload-image/`;
  } else {
    // Upload temporary image for new product
    url += `upload-temp-image/`;
  }

  const res = await fetchWithAuth(url, {
    method,
    body: formData, // FormData automatically sets multipart/form-data
  });

  if (!res || !res.ok) {
    // Log server response for debugging
    const text = await res.text();
    console.error("Upload failed:", text);
    throw new Error("Failed to upload image");
  }

  return await res.json(); // expects { url: "..." }
}
