import { fetchWithAuth } from '../api';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/forecast/`;

export async function fetchMonthlyForecast(tenantId, targetMonth) {
  const res = await fetchWithAuth(`${BASE_URL}forecast/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId, target_month: targetMonth })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchNinetyDayForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}90days/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch 90 day forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchCustomsForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}customs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch customs forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchOtherForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}other/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch other forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchFinancialForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}financial/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch financial forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchGeographicForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}geographic/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch geographic forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchRisksForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}risks/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_uuid: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch risks forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}

export async function fetchPricingForecast(tenantId) {
  const res = await fetchWithAuth(`${BASE_URL}pricing/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_id: tenantId })
  });
  if (!res || !res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch pricing forecast: ${res?.status} ${errorText}`);
  }
  return await res.json();
}
