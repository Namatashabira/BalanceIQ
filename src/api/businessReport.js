import axios from 'axios';
import { fetchWithAuth } from '../api';

const API_BASE = `${import.meta.env.VITE_API_URL || 'https://web-production-36021.up.railway.app/api'}/business-reports/`;

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return { headers: { Authorization: token ? `Bearer ${token}` : '' } };
};

export const listReports = async () => {
  const res = await axios.get(API_BASE, getHeaders());
  return res.data;
};

export const getReport = async (id) => {
  const res = await axios.get(`${API_BASE}${id}/`, getHeaders());
  return res.data;
};

export const createReport = async (payload) => {
  const res = await axios.post(API_BASE, payload, getHeaders());
  return res.data;
};

export const updateReport = async (id, payload) => {
  const res = await axios.put(`${API_BASE}${id}/`, payload, getHeaders());
  return res.data;
};

export const deleteReport = async (id) => {
  const res = await axios.delete(`${API_BASE}${id}/`, getHeaders());
  return res.data;
};
