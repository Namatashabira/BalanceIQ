import { fetchWithAuth } from '../api';

const BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/school-accounting`;

const json = async (res) => (res?.ok ? res.json() : null);

// Expenses
export const fetchSchoolExpenses = (params = {}) =>
  fetchWithAuth(`${BASE}/expenses/?${new URLSearchParams(params)}`).then(json);

export const fetchSchoolExpenseSummary = () =>
  fetchWithAuth(`${BASE}/expenses/summary/`).then(json);

export const createSchoolExpense = (data) =>
  fetchWithAuth(`${BASE}/expenses/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const updateSchoolExpense = (id, data) =>
  fetchWithAuth(`${BASE}/expenses/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const deleteSchoolExpense = (id) =>
  fetchWithAuth(`${BASE}/expenses/${id}/`, { method: 'DELETE' });

// Expense Categories
export const fetchExpenseCategories = () =>
  fetchWithAuth(`${BASE}/expense-categories/`).then(json);

export const createExpenseCategory = (data) =>
  fetchWithAuth(`${BASE}/expense-categories/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

// Income
export const fetchSchoolIncome = (params = {}) =>
  fetchWithAuth(`${BASE}/income/?${new URLSearchParams(params)}`).then(json);

export const fetchSchoolIncomeSummary = () =>
  fetchWithAuth(`${BASE}/income/summary/`).then(json);

export const createSchoolIncome = (data) =>
  fetchWithAuth(`${BASE}/income/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const updateSchoolIncome = (id, data) =>
  fetchWithAuth(`${BASE}/income/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const deleteSchoolIncome = (id) =>
  fetchWithAuth(`${BASE}/income/${id}/`, { method: 'DELETE' });

// Teacher Salaries
export const fetchTeacherSalaries = (params = {}) =>
  fetchWithAuth(`${BASE}/teacher-salaries/?${new URLSearchParams(params)}`).then(json);

export const fetchSalarySummary = () =>
  fetchWithAuth(`${BASE}/teacher-salaries/summary/`).then(json);

export const createTeacherSalary = (data) =>
  fetchWithAuth(`${BASE}/teacher-salaries/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const updateTeacherSalary = (id, data) =>
  fetchWithAuth(`${BASE}/teacher-salaries/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const deleteTeacherSalary = (id) =>
  fetchWithAuth(`${BASE}/teacher-salaries/${id}/`, { method: 'DELETE' });

// Assets
export const fetchSchoolAssets = (params = {}) =>
  fetchWithAuth(`${BASE}/assets/?${new URLSearchParams(params)}`).then(json);

export const createSchoolAsset = (data) =>
  fetchWithAuth(`${BASE}/assets/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const updateSchoolAsset = (id, data) =>
  fetchWithAuth(`${BASE}/assets/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const deleteSchoolAsset = (id) =>
  fetchWithAuth(`${BASE}/assets/${id}/`, { method: 'DELETE' });

// Debts / Liabilities
export const fetchSchoolDebts = (params = {}) =>
  fetchWithAuth(`${BASE}/debts/?${new URLSearchParams(params)}`).then(json);

export const createSchoolDebt = (data) =>
  fetchWithAuth(`${BASE}/debts/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const updateSchoolDebt = (id, data) =>
  fetchWithAuth(`${BASE}/debts/${id}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json);

export const deleteSchoolDebt = (id) =>
  fetchWithAuth(`${BASE}/debts/${id}/`, { method: 'DELETE' });

// Profit & Loss
export const fetchSchoolProfitLoss = (params = {}) =>
  fetchWithAuth(`${BASE}/profit-loss/?${new URLSearchParams(params)}`).then(json);

// Balance Sheet
export const fetchSchoolBalanceSheet = () =>
  fetchWithAuth(`${BASE}/balance-sheet/`).then(json);
